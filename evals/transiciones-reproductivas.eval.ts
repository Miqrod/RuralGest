import { describe, it, expect } from 'vitest'
import { addDays, parseISO } from 'date-fns'

import {
  validarTransicionReproductiva,
  estadoPermiteEvento,
} from '@/modules/ganadero/reproductivo/domain/rules'
import { evalCycleRules } from '@/modules/ganadero/reproductivo/domain/rules/ReproductiveCycleRules'
import { buildSnapshot } from '@/modules/ganadero/reproductivo/domain/rules/ReproductiveProjection'
import type { ReproductiveContext } from '@/modules/ganadero/reproductivo/domain/types'

// =============================================================================
// EVAL: Transiciones reproductivas — modelo PRD-CORRECTIVO
//
// Estados válidos: VACÍA, CUBIERTA, GESTANTE, NULL
// LACTANTE queda obsoleto: la lactación es historia de maternidad, no reproductiva.
//
// DESTETE no transiciona el estado reproductivo (finaliza vínculos madre-cría).
// validarTransicionReproductiva('DESTETE', x) devuelve el mismo estado que recibe.
//
// El ciclo debe existir antes de cualquier evento: ni CUBRICION ni CONFIRMACION
// crean ciclos. evalCycleRules siempre devuelve 'reutilizar'.
//
// PARTO fija resultado='parto' en el ciclo actual + abre nuevo ciclo VACÍA.
// El estado resultante en el animal es 'vacia' (refleja el nuevo ciclo).
//
// Ningún test accede a la BD — toda la lógica es pura.
// =============================================================================

// ── Fixtures ─────────────────────────────────────────────────────────────────

const ANIMAL_VACIA: ReproductiveContext['animal'] = {
  id:                  'uuid-animal',
  especie:             'vacuno',
  es_reproductora:     true,
  estado_reproductivo: 'vacia',
}

const CICLO_ABIERTO: NonNullable<ReproductiveContext['cicloAbierto']> = {
  id:           'uuid-ciclo',
  animal_id:    'uuid-animal',
  numero_ciclo: 1,
  fecha_inicio: '2026-05-01',
  fecha_fin:    null,
  resultado:    null,
  created_at:   '2026-05-01T00:00:00Z',
  created_by:   null,
}

// ── CUBRICION ─────────────────────────────────────────────────────────────────

describe('EVAL: Transiciones — CUBRICION', () => {

  it('vacia → cubierta: primera cubrición del ciclo reproductivo', () => {
    expect(validarTransicionReproductiva('CUBRICION', 'vacia')).toBe('cubierta')
  })

  it('cubierta → cubierta: cubrición repetida en el mismo ciclo (válido en extensivo)', () => {
    // En ganadería extensiva el toro permanece con el rebaño varias semanas.
    // Pueden registrarse múltiples cubriciones en el mismo ciclo; la proyección
    // usa siempre la última. La transición cubierta→cubierta es deliberadamente válida.
    expect(validarTransicionReproductiva('CUBRICION', 'cubierta')).toBe('cubierta')
  })

  it('gestante → lanza: no se puede cubrir un animal que ya está gestante', () => {
    expect(() => validarTransicionReproductiva('CUBRICION', 'gestante')).toThrow()
  })

})

// ── PARTO ─────────────────────────────────────────────────────────────────────

describe('EVAL: Transiciones — PARTO', () => {

  it('cubierta → vacia: parto sin confirmación de gestación previa (válido en extensivo)', () => {
    // El estado resultante es 'vacia' porque el Parto abre un nuevo ciclo en ese estado.
    // El ciclo anterior recibe resultado='parto' pero puede seguir recibiendo destetes.
    expect(validarTransicionReproductiva('PARTO', 'cubierta')).toBe('vacia')
  })

  it('gestante → vacia: flujo completo con confirmación previa', () => {
    expect(validarTransicionReproductiva('PARTO', 'gestante')).toBe('vacia')
  })

  it('vacia → lanza: no puede parir sin haber sido cubierta', () => {
    expect(() => validarTransicionReproductiva('PARTO', 'vacia')).toThrow()
  })

})

// ── DESTETE ───────────────────────────────────────────────────────────────────

describe('EVAL: Transiciones — DESTETE', () => {

  it('DESTETE no transiciona el estado reproductivo: devuelve el mismo estado', () => {
    // El Destete finaliza vínculos madre-cría, no cambia el ciclo reproductivo.
    // La madre puede estar en cualquier estado reproductivo mientras lacta.
    expect(validarTransicionReproductiva('DESTETE', 'vacia')).toBe('vacia')
    expect(validarTransicionReproductiva('DESTETE', 'cubierta')).toBe('cubierta')
    expect(validarTransicionReproductiva('DESTETE', 'gestante')).toBe('gestante')
  })

})

// ── ABORTO ────────────────────────────────────────────────────────────────────

describe('EVAL: Transiciones — ABORTO', () => {

  it('cubierta → vacia: aborto tras cubrición sin confirmación gestacional', () => {
    expect(validarTransicionReproductiva('ABORTO', 'cubierta')).toBe('vacia')
  })

  it('gestante → vacia: aborto después de confirmación gestacional', () => {
    expect(validarTransicionReproductiva('ABORTO', 'gestante')).toBe('vacia')
  })

  it('vacia → lanza: no puede abortar sin estar cubierta o gestante', () => {
    expect(() => validarTransicionReproductiva('ABORTO', 'vacia')).toThrow()
  })

})

// ── estadoPermiteEvento — tabla completa ─────────────────────────────────────
// Versión booleana de validarTransicionReproductiva.
// DESTETE no aparece aquí: no se valida mediante esta función.

describe('EVAL: estadoPermiteEvento — matriz de estados y eventos', () => {

  // CUBRICION
  it('CUBRICION desde vacia → permitido', () => {
    expect(estadoPermiteEvento('vacia', 'CUBRICION')).toBe(true)
  })
  it('CUBRICION desde cubierta → permitido (monta repetida)', () => {
    expect(estadoPermiteEvento('cubierta', 'CUBRICION')).toBe(true)
  })
  it('CUBRICION desde gestante → denegado', () => {
    expect(estadoPermiteEvento('gestante', 'CUBRICION')).toBe(false)
  })

  // PARTO
  it('PARTO desde cubierta → permitido (parto sin confirmación, típico en extensivo)', () => {
    expect(estadoPermiteEvento('cubierta', 'PARTO')).toBe(true)
  })
  it('PARTO desde gestante → permitido', () => {
    expect(estadoPermiteEvento('gestante', 'PARTO')).toBe(true)
  })
  it('PARTO desde vacia → denegado', () => {
    expect(estadoPermiteEvento('vacia', 'PARTO')).toBe(false)
  })

  // ABORTO
  it('ABORTO desde cubierta → permitido', () => {
    expect(estadoPermiteEvento('cubierta', 'ABORTO')).toBe(true)
  })
  it('ABORTO desde gestante → permitido', () => {
    expect(estadoPermiteEvento('gestante', 'ABORTO')).toBe(true)
  })
  it('ABORTO desde vacia → denegado', () => {
    expect(estadoPermiteEvento('vacia', 'ABORTO')).toBe(false)
  })

  // null — módulo reproductivo no aplica
  it('estado null → deniega todos los eventos (es_reproductora=false)', () => {
    // null ≠ 'vacia': son conceptos distintos. null = el módulo reproductivo no aplica.
    expect(estadoPermiteEvento(null, 'CUBRICION')).toBe(false)
    expect(estadoPermiteEvento(null, 'PARTO')).toBe(false)
    expect(estadoPermiteEvento(null, 'ABORTO')).toBe(false)
  })

})

// ── evalCycleRules ────────────────────────────────────────────────────────────

describe('EVAL: ReproductiveCycleRules — CUBRICION', () => {

  it('sin ciclo abierto → lanza (el ciclo debe existir antes de la cubrición)', () => {
    // El ciclo se crea al convertirse el animal en REPRODUCTORA.
    // Intentar una cubrición sin ciclo indica un fallo en el flujo previo.
    const ctx: ReproductiveContext = {
      animal:           ANIMAL_VACIA,
      cicloAbierto:     null,
      eventoSolicitado: 'CUBRICION',
      fechaEvento:      '2026-07-01',
    }
    expect(() => evalCycleRules(ctx)).toThrow(/CUBRICION requiere un ciclo/)
  })

  it('con ciclo abierto → acción "reutilizar" (cubrición dentro del ciclo activo)', () => {
    const ctx: ReproductiveContext = {
      animal:           { ...ANIMAL_VACIA, estado_reproductivo: 'cubierta' },
      cicloAbierto:     CICLO_ABIERTO,
      eventoSolicitado: 'CUBRICION',
      fechaEvento:      '2026-07-15',
    }
    const decision = evalCycleRules(ctx)
    expect(decision.accion).toBe('reutilizar')
    expect(decision.cicloId).toBe('uuid-ciclo')
  })

})

describe('EVAL: ReproductiveCycleRules — PARTO', () => {

  it('con ciclo abierto → acción "reutilizar" (el parto fija el resultado del ciclo activo)', () => {
    const ctx: ReproductiveContext = {
      animal:           { ...ANIMAL_VACIA, estado_reproductivo: 'gestante' },
      cicloAbierto:     CICLO_ABIERTO,
      eventoSolicitado: 'PARTO',
      fechaEvento:      '2026-10-01',
    }
    const decision = evalCycleRules(ctx)
    expect(decision.accion).toBe('reutilizar')
    expect(decision.cicloId).toBe('uuid-ciclo')
  })

  it('sin ciclo abierto → lanza (el parto sin ciclo previo indica corrupción de datos)', () => {
    const ctx: ReproductiveContext = {
      animal:           { ...ANIMAL_VACIA, estado_reproductivo: 'gestante' },
      cicloAbierto:     null,
      eventoSolicitado: 'PARTO',
      fechaEvento:      '2026-10-01',
    }
    expect(() => evalCycleRules(ctx)).toThrow(/PARTO requiere un ciclo/)
  })

})

// ── buildSnapshot — CUBRICION ─────────────────────────────────────────────────

describe('EVAL: ReproductiveProjection — buildSnapshot CUBRICION', () => {

  it('vacuno: estado → cubierta y fechaPrevistaParto = fechaEvento + 283 días', () => {
    const ctx: ReproductiveContext = {
      animal:           ANIMAL_VACIA,
      cicloAbierto:     CICLO_ABIERTO,
      eventoSolicitado: 'CUBRICION',
      fechaEvento:      '2026-07-01',
    }
    const snapshot = buildSnapshot(ctx, 'uuid-ciclo')
    expect(snapshot.estadoReproductivo).toBe('cubierta')
    const esperada = addDays(parseISO('2026-07-01'), 283).toISOString().split('T')[0]
    expect(snapshot.fechaPrevistaParto).toBe(esperada)
    expect(snapshot.diasRestantes).not.toBeNull()
  })

  it('porcino: fechaPrevistaParto = fechaEvento + 114 días', () => {
    const ctx: ReproductiveContext = {
      animal:           { ...ANIMAL_VACIA, especie: 'porcino' },
      cicloAbierto:     CICLO_ABIERTO,
      eventoSolicitado: 'CUBRICION',
      fechaEvento:      '2026-07-01',
    }
    const snapshot = buildSnapshot(ctx, 'uuid-ciclo')
    const esperada = addDays(parseISO('2026-07-01'), 114).toISOString().split('T')[0]
    expect(snapshot.fechaPrevistaParto).toBe(esperada)
  })

  it('cicloActivoId se propaga al snapshot tal cual lo recibe', () => {
    const ctx: ReproductiveContext = {
      animal:           { ...ANIMAL_VACIA, estado_reproductivo: 'cubierta' },
      cicloAbierto:     CICLO_ABIERTO,
      eventoSolicitado: 'CUBRICION',
      fechaEvento:      '2026-07-15',
    }
    const snapshot = buildSnapshot(ctx, 'uuid-ciclo')
    expect(snapshot.cicloActivoId).toBe('uuid-ciclo')
  })

})

// ── buildSnapshot — PARTO ─────────────────────────────────────────────────────

describe('EVAL: ReproductiveProjection — buildSnapshot PARTO', () => {

  it('gestante → vacia; fechaPrevistaParto es null (el parto abrió un nuevo ciclo VACÍA)', () => {
    // El estado 'vacia' refleja que el animal ya tiene un nuevo ciclo reproductivo activo.
    // El ciclo anterior recibió resultado='parto' pero sigue sin fecha_fin mientras
    // existan vínculos madre-cría pendientes de destete.
    const ctx: ReproductiveContext = {
      animal:           { ...ANIMAL_VACIA, estado_reproductivo: 'gestante' },
      cicloAbierto:     CICLO_ABIERTO,
      eventoSolicitado: 'PARTO',
      fechaEvento:      '2026-10-01',
    }
    const snapshot = buildSnapshot(ctx, 'uuid-ciclo')
    expect(snapshot.estadoReproductivo).toBe('vacia')
    expect(snapshot.fechaPrevistaParto).toBeNull()
    expect(snapshot.diasRestantes).toBeNull()
  })

})
