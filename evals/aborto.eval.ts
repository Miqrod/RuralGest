import { describe, it, expect } from 'vitest'

import { validarTransicionReproductiva, estadoPermiteEvento } from '@/modules/ganadero/reproductivo/domain/rules'
import { checkEligibility } from '@/modules/ganadero/reproductivo/domain/rules/ReproductiveEligibilityRules'
import { getAvailableActions } from '@/modules/ganadero/animales/domain/availableActions'
import type { ReproductiveContext } from '@/modules/ganadero/reproductivo/domain/types'

// =============================================================================
// EVAL: ABORTO (PRD011)
//
// El aborto registra la pérdida de gestación antes del parto.
// Consecuencias en el RPC (atómicas, no evaluadas aquí):
//   · Se crea evento ABORTO vinculado al ciclo abierto más reciente
//   · El ciclo queda cerrado con resultado = 'aborto'
//   · Si es_reproductora = true → se abre un nuevo ciclo en 'vacia'
//   · Si es_reproductora = false → estado_reproductivo queda NULL (rama defensiva)
//
// El pipeline de aplicación para ABORTO es:
//   Contexto → EligibilityRules → RPC transaccional
//
// No se invocan CycleRules ni Projection porque el RPC resuelve el ciclo
// internamente con ORDER BY numero_ciclo DESC LIMIT 1. El ciclo_id no es
// un parámetro externo, a diferencia de cubricion/confirmacion/parto.
// =============================================================================

// ── Fixtures ─────────────────────────────────────────────────────────────────

const ANIMAL_REPRODUCTORA = {
  id:                  'uuid-animal',
  especie:             'vacuno' as const,
  es_reproductora:     true,
  estado_reproductivo: 'cubierta' as const,
}

const CICLO_ABIERTO = {
  id:           'uuid-ciclo',
  animal_id:    'uuid-animal',
  numero_ciclo: 2,
  fecha_inicio: '2026-06-01',
  fecha_fin:    null,
  resultado:    null,
  created_at:   '2026-06-01T10:00:00Z',
  created_by:   null,
}

const CTX_DESDE_CUBIERTA: ReproductiveContext = {
  animal:           { ...ANIMAL_REPRODUCTORA, estado_reproductivo: 'cubierta' },
  cicloAbierto:     CICLO_ABIERTO,
  eventoSolicitado: 'ABORTO',
  fechaEvento:      '2026-08-20',
}

const CTX_DESDE_GESTANTE: ReproductiveContext = {
  animal:           { ...ANIMAL_REPRODUCTORA, estado_reproductivo: 'gestante' },
  cicloAbierto:     CICLO_ABIERTO,
  eventoSolicitado: 'ABORTO',
  fechaEvento:      '2026-08-20',
}

// ── TRANSICIONES ─────────────────────────────────────────────────────────────

describe('EVAL: ABORTO — transiciones de estado', () => {

  it('cubierta → vacia es válida', () => {
    // Una cubrición puede perderse antes de confirmar gestación. El estado
    // resultante es 'vacia': el ciclo se cierra y, si sigue siendo reproductora,
    // arranca un nuevo ciclo limpio.
    expect(validarTransicionReproductiva('ABORTO', 'cubierta')).toBe('vacia')
  })

  it('gestante → vacia es válida', () => {
    // El aborto más habitual: pérdida de gestación ya confirmada. El resultado
    // es el mismo que desde cubierta — ciclo cerrado y nuevo ciclo en 'vacia'.
    expect(validarTransicionReproductiva('ABORTO', 'gestante')).toBe('vacia')
  })

  it('vacia → aborto lanza (no hay gestación que perder)', () => {
    // Una hembra en estado vacía no tiene gestación en curso. Intentar registrar
    // un aborto en este estado es un error de dominio: no hay nada que perder.
    expect(() => validarTransicionReproductiva('ABORTO', 'vacia')).toThrow()
  })

  it('estadoPermiteEvento: cubierta permite ABORTO', () => {
    // Versión booleana de la regla anterior: la UI y EligibilityRules la usan
    // para decidir si el botón/acción debe ofrecerse al usuario.
    expect(estadoPermiteEvento('cubierta', 'ABORTO')).toBe(true)
  })

  it('estadoPermiteEvento: gestante permite ABORTO', () => {
    expect(estadoPermiteEvento('gestante', 'ABORTO')).toBe(true)
  })

  it('estadoPermiteEvento: vacia no permite ABORTO', () => {
    // Estado vacía = sin gestación activa. El botón de aborto no debe aparecer.
    expect(estadoPermiteEvento('vacia', 'ABORTO')).toBe(false)
  })

  it('estadoPermiteEvento: null (no reproductora) no permite ABORTO', () => {
    // NULL indica que el módulo reproductivo no aplica al animal. Nunca debe
    // permitirse registrar un aborto en este caso.
    expect(estadoPermiteEvento(null, 'ABORTO')).toBe(false)
  })

})

// ── ELIGIBILITY RULES ─────────────────────────────────────────────────────────

describe('EVAL: ABORTO — elegibilidad', () => {

  it('cubierta con ciclo abierto: elegible', () => {
    // Caso más habitual: cubrición reciente, sin confirmación de gestación,
    // y se detecta pérdida. El sistema debe permitir registrar el aborto.
    const result = checkEligibility(CTX_DESDE_CUBIERTA)
    expect(result.eligible).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('gestante con ciclo abierto: elegible', () => {
    // Gestación ya confirmada y luego perdida. También elegible. El aborto
    // es válido desde cubierta O gestante — la confirmación no es obligatoria.
    const result = checkEligibility(CTX_DESDE_GESTANTE)
    expect(result.eligible).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('vacía con ciclo abierto: no elegible (no hay gestación activa)', () => {
    // La eligibility rechaza este caso antes de llegar al RPC. Sin gestación
    // en curso, no existe nada que abortar.
    const ctx: ReproductiveContext = {
      ...CTX_DESDE_CUBIERTA,
      animal: { ...ANIMAL_REPRODUCTORA, estado_reproductivo: 'vacia' },
    }
    const result = checkEligibility(ctx)
    expect(result.eligible).toBe(false)
  })

  it('no reproductora sin ciclo: no elegible', () => {
    // Animal que nunca ha tenido historial reproductivo activo. Sin ciclo
    // abierto ni flag reproductora, no puede recibir ningún evento del módulo.
    const ctx: ReproductiveContext = {
      ...CTX_DESDE_CUBIERTA,
      animal:      { ...ANIMAL_REPRODUCTORA, es_reproductora: false, estado_reproductivo: null },
      cicloAbierto: null,
    }
    const result = checkEligibility(ctx)
    expect(result.eligible).toBe(false)
  })

  it('no reproductora pero con ciclo histórico abierto y cubierta: elegible (datos históricos)', () => {
    // Imposible en operativa normal tras PRD-correctivo (gestante + no-reproductora
    // no puede ocurrir porque el cambio de tipo cierra el ciclo). Puede existir
    // en datos históricos del seed. La eligibility acepta el caso porque el ciclo
    // ya estaba en curso; el RPC cierra el ciclo y deja estado_reproductivo = NULL.
    const ctx: ReproductiveContext = {
      ...CTX_DESDE_CUBIERTA,
      animal: { ...ANIMAL_REPRODUCTORA, es_reproductora: false, estado_reproductivo: 'cubierta' },
      cicloAbierto: CICLO_ABIERTO,
    }
    const result = checkEligibility(ctx)
    expect(result.eligible).toBe(true)
  })

})

// ── AVAILABLE ACTIONS ─────────────────────────────────────────────────────────

describe('EVAL: ABORTO — acción disponible', () => {

  it('cubierta con ciclo abierto → incluye aborto', () => {
    // El botón "Registrar aborto" debe aparecer en la ficha cuando la hembra
    // está cubierta y tiene ciclo abierto.
    const acciones = getAvailableActions({
      estadoVital:         'vivo',
      estadoReproductivo:  'cubierta',
      tieneCicloAbierto:   true,
      esReproductora:      true,
      tieneCriasElegibles: false,
    })
    expect(acciones.has('aborto')).toBe(true)
  })

  it('gestante con ciclo abierto → incluye aborto', () => {
    // Igual desde gestante: la gestación confirmada también puede perderse.
    const acciones = getAvailableActions({
      estadoVital:         'vivo',
      estadoReproductivo:  'gestante',
      tieneCicloAbierto:   true,
      esReproductora:      true,
      tieneCriasElegibles: false,
    })
    expect(acciones.has('aborto')).toBe(true)
  })

  it('vacía con ciclo abierto → no incluye aborto', () => {
    // Sin gestación activa el botón de aborto no debe mostrarse.
    const acciones = getAvailableActions({
      estadoVital:         'vivo',
      estadoReproductivo:  'vacia',
      tieneCicloAbierto:   true,
      esReproductora:      true,
      tieneCriasElegibles: false,
    })
    expect(acciones.has('aborto')).toBe(false)
  })

  it('cubierta sin ciclo abierto → no incluye aborto', () => {
    // El gate tieneCicloAbierto protege de estados incoherentes: aunque el
    // estado reproductivo permita el aborto, sin ciclo abierto el RPC no
    // podría completar la operación.
    const acciones = getAvailableActions({
      estadoVital:         'vivo',
      estadoReproductivo:  'cubierta',
      tieneCicloAbierto:   false,
      esReproductora:      true,
      tieneCriasElegibles: false,
    })
    expect(acciones.has('aborto')).toBe(false)
  })

})
