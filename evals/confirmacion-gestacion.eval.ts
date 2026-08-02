import { describe, it, expect } from 'vitest'
import { addDays, parseISO } from 'date-fns'

import { validarTransicionReproductiva, estadoPermiteEvento } from '@/modules/ganadero/reproductivo/domain/rules'
import { checkEligibility } from '@/modules/ganadero/reproductivo/domain/rules/ReproductiveEligibilityRules'
import { evalCycleRules } from '@/modules/ganadero/reproductivo/domain/rules/ReproductiveCycleRules'
import { buildSnapshot } from '@/modules/ganadero/reproductivo/domain/rules/ReproductiveProjection'
import type { ReproductiveContext } from '@/modules/ganadero/reproductivo/domain/types'

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
  numero_ciclo: 1,
  fecha_inicio: '2026-05-01',
  fecha_fin:    null,
  resultado:    null,
  created_at:   '2026-05-01T00:00:00Z',
  created_by:   null,
}

// Contexto base para confirmación desde estado cubierta (PRD007, comportamiento existente)
const CTX_DESDE_CUBIERTA: ReproductiveContext = {
  animal:           { ...ANIMAL_REPRODUCTORA, estado_reproductivo: 'cubierta' },
  cicloAbierto:     CICLO_ABIERTO,
  eventoSolicitado: 'CONFIRMACION_GESTACION',
  fechaEvento:      '2026-07-15',
}

// Contexto para confirmación desde estado vacia (PRD008, sin cubrición previa)
const CTX_DESDE_VACIA: ReproductiveContext = {
  animal:                  { ...ANIMAL_REPRODUCTORA, estado_reproductivo: 'vacia' },
  cicloAbierto:            null,
  eventoSolicitado:        'CONFIRMACION_GESTACION',
  fechaEvento:             '2026-07-15',
  mesesGestacionEstimados: 3,
}

// ── TRANSICIONES ─────────────────────────────────────────────────────────────

describe('EVAL: CONFIRMACION_GESTACION — transiciones de estado', () => {

  it('cubierta → gestante es válida', () => {
    expect(validarTransicionReproductiva('CONFIRMACION_GESTACION', 'cubierta')).toBe('gestante')
  })

  it('vacia → gestante es válida (PRD008)', () => {
    expect(validarTransicionReproductiva('CONFIRMACION_GESTACION', 'vacia')).toBe('gestante')
  })

  it('gestante → gestante lanza (transición inválida)', () => {
    expect(() => validarTransicionReproductiva('CONFIRMACION_GESTACION', 'gestante')).toThrow()
  })

  it('estadoPermiteEvento: cubierta permite CONFIRMACION_GESTACION', () => {
    expect(estadoPermiteEvento('cubierta', 'CONFIRMACION_GESTACION')).toBe(true)
  })

  it('estadoPermiteEvento: vacia permite CONFIRMACION_GESTACION (PRD008)', () => {
    expect(estadoPermiteEvento('vacia', 'CONFIRMACION_GESTACION')).toBe(true)
  })

  it('estadoPermiteEvento: gestante no permite CUBRICION (restricción ciclo)', () => {
    expect(estadoPermiteEvento('gestante', 'CUBRICION')).toBe(false)
  })

})

// ── ELIGIBILITY RULES ─────────────────────────────────────────────────────────

describe('EVAL: CONFIRMACION_GESTACION — elegibilidad', () => {

  it('desde cubierta con ciclo abierto: elegible', () => {
    const result = checkEligibility(CTX_DESDE_CUBIERTA)
    expect(result.eligible).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('desde vacia sin ciclo abierto: elegible (PRD008)', () => {
    const result = checkEligibility(CTX_DESDE_VACIA)
    expect(result.eligible).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('animal no reproductora: no elegible', () => {
    const ctx: ReproductiveContext = {
      ...CTX_DESDE_CUBIERTA,
      animal: { ...ANIMAL_REPRODUCTORA, es_reproductora: false, estado_reproductivo: null },
    }
    const result = checkEligibility(ctx)
    expect(result.eligible).toBe(false)
  })

})

// ── CYCLE RULES ───────────────────────────────────────────────────────────────

describe('EVAL: CONFIRMACION_GESTACION — decisión de ciclo', () => {

  it('desde cubierta con ciclo abierto: reutilizar', () => {
    const decision = evalCycleRules(CTX_DESDE_CUBIERTA)
    expect(decision.accion).toBe('reutilizar')
    expect(decision.cicloId).toBe('uuid-ciclo')
  })

  it('desde vacia sin ciclo abierto: crear (PRD008)', () => {
    const decision = evalCycleRules(CTX_DESDE_VACIA)
    expect(decision.accion).toBe('crear')
    expect(decision.cicloId).toBeNull()
  })

})

// ── PROJECTION ────────────────────────────────────────────────────────────────

describe('EVAL: CONFIRMACION_GESTACION — proyección', () => {

  it('desde cubierta: estado → gestante, fechaPrevistaParto null (ya estaba calculada)', () => {
    const snapshot = buildSnapshot(CTX_DESDE_CUBIERTA, 'uuid-ciclo')
    expect(snapshot.estadoReproductivo).toBe('gestante')
    expect(snapshot.cicloActivoId).toBe('uuid-ciclo')
    expect(snapshot.fechaPrevistaParto).toBeNull()
  })

  it('desde vacia con 3 meses estimados: calcula fechaPrevistaParto (PRD008)', () => {
    const snapshot = buildSnapshot(CTX_DESDE_VACIA, null)
    expect(snapshot.estadoReproductivo).toBe('gestante')
    expect(snapshot.cicloActivoId).toBeNull()  // RPC asigna el id real
    // vacuno: 283 días − 3 meses × 30 = 283 − 90 = 193 días desde la confirmación
    const esperada = addDays(parseISO('2026-07-15'), 193).toISOString().split('T')[0]
    expect(snapshot.fechaPrevistaParto).toBe(esperada)
    expect(snapshot.diasRestantes).not.toBeNull()
  })

  it('desde vacia sin meses estimados: fechaPrevistaParto null', () => {
    const ctx: ReproductiveContext = { ...CTX_DESDE_VACIA, mesesGestacionEstimados: undefined }
    const snapshot = buildSnapshot(ctx, null)
    expect(snapshot.fechaPrevistaParto).toBeNull()
  })

})
