import { describe, it, expect } from 'vitest'

import {
  canWean,
  getWeaningBlockers,
  type CriaParaDestete,
} from '@/modules/ganadero/reproductivo/domain/rules/ReproductiveEligibilityRules'

// ── Fixtures ─────────────────────────────────────────────────────────────────

const CRIA_ELEGIBLE: CriaParaDestete = {
  tipo_productivo_nombre: 'Cría',
  estado_vital:           'vivo',
  estado_vinculo_materno: 'activo',
  madre_id:               'uuid-madre',
}

// ── canWean ───────────────────────────────────────────────────────────────────

describe('EVAL: Destete — canWean', () => {

  it('cría elegible: puede ser destetada', () => {
    expect(canWean(CRIA_ELEGIBLE)).toBe(true)
  })

  it('tipo_productivo Recría: no puede (ya destetada)', () => {
    expect(canWean({ ...CRIA_ELEGIBLE, tipo_productivo_nombre: 'Recría' })).toBe(false)
  })

  it('tipo_productivo null: no puede (sin clasificar)', () => {
    expect(canWean({ ...CRIA_ELEGIBLE, tipo_productivo_nombre: null })).toBe(false)
  })

  it('estado_vital muerto: no puede', () => {
    expect(canWean({ ...CRIA_ELEGIBLE, estado_vital: 'muerto' })).toBe(false)
  })

  it('estado_vital vendido: no puede', () => {
    expect(canWean({ ...CRIA_ELEGIBLE, estado_vital: 'vendido' })).toBe(false)
  })

  it('vínculo finalizado: no puede (destete ya registrado)', () => {
    expect(canWean({ ...CRIA_ELEGIBLE, estado_vinculo_materno: 'finalizado' })).toBe(false)
  })

  it('vínculo null: no puede (historial previo a PRD010, sin información)', () => {
    expect(canWean({ ...CRIA_ELEGIBLE, estado_vinculo_materno: null })).toBe(false)
  })

  it('sin madre_id: no puede (no se puede cerrar la dependencia funcional)', () => {
    expect(canWean({ ...CRIA_ELEGIBLE, madre_id: null })).toBe(false)
  })

  it('múltiples bloqueadores: no puede (todos se acumulan)', () => {
    expect(canWean({
      tipo_productivo_nombre: 'Recría',
      estado_vital:           'muerto',
      estado_vinculo_materno: 'finalizado',
      madre_id:               null,
    })).toBe(false)
  })

})

// ── getWeaningBlockers ────────────────────────────────────────────────────────

describe('EVAL: Destete — getWeaningBlockers', () => {

  it('cría elegible: sin bloqueadores', () => {
    expect(getWeaningBlockers(CRIA_ELEGIBLE)).toHaveLength(0)
  })

  it('tipo Recría: devuelve mensaje de ya destetada', () => {
    const blockers = getWeaningBlockers({ ...CRIA_ELEGIBLE, tipo_productivo_nombre: 'Recría' })
    expect(blockers).toHaveLength(1)
    expect(blockers[0]).toMatch(/ya haya sido destetado/)
  })

  it('estado muerto: devuelve mensaje con el estado actual', () => {
    const blockers = getWeaningBlockers({ ...CRIA_ELEGIBLE, estado_vital: 'muerto' })
    expect(blockers[0]).toMatch(/muerto/)
  })

  it('vínculo null: devuelve mensaje con estado desconocido', () => {
    const blockers = getWeaningBlockers({ ...CRIA_ELEGIBLE, estado_vinculo_materno: null })
    expect(blockers[0]).toMatch(/desconocido/)
  })

  it('vínculo finalizado: devuelve mensaje con estado finalizado', () => {
    const blockers = getWeaningBlockers({ ...CRIA_ELEGIBLE, estado_vinculo_materno: 'finalizado' })
    expect(blockers[0]).toMatch(/finalizado/)
  })

  it('sin madre_id: devuelve mensaje de madre no registrada', () => {
    const blockers = getWeaningBlockers({ ...CRIA_ELEGIBLE, madre_id: null })
    expect(blockers[0]).toMatch(/madre/)
  })

  it('múltiples bloqueadores: devuelve uno por condición', () => {
    const blockers = getWeaningBlockers({
      tipo_productivo_nombre: 'Recría',
      estado_vital:           'muerto',
      estado_vinculo_materno: 'finalizado',
      madre_id:               null,
    })
    expect(blockers).toHaveLength(4)
  })

})

// shouldCloseCycle queda obsoleto en el modelo PRD-CORRECTIVO.
// El Destete ya no cierra ciclos reproductivos — finaliza vínculos madre-cría.
// Cuando se finaliza el último vínculo de un ciclo con resultado='parto',
// el RPC actualiza fecha_fin de ese ciclo (historia paralela, no reproductiva).

// ── Comportamiento en lote (pre-validación de la action) ──────────────────────
//
// registrarDesteteLote aplica getWeaningBlockers a cada cría ANTES de llamar al RPC.
// Si alguna falla, lanza error y ninguna llega al RPC (fail-fast).
// La atomicidad entre crías elegibles la garantiza el RPC registrar_destete_lote.

describe('EVAL: Destete en lote — pre-validación de la action', () => {

  const CRIA_2: CriaParaDestete = {
    tipo_productivo_nombre: 'Cría',
    estado_vital:           'vivo',
    estado_vinculo_materno: 'activo',
    madre_id:               'uuid-madre',
  }

  it('lote de 2 crías válidas: ninguna tiene bloqueadores', () => {
    const lote = [CRIA_ELEGIBLE, CRIA_2]
    const todosElegibles = lote.every(c => canWean(c))
    expect(todosElegibles).toBe(true)
  })

  it('lote mixto (1ª válida, 2ª ya destetada): la 2ª bloquea el lote completo', () => {
    const lote: CriaParaDestete[] = [
      CRIA_ELEGIBLE,
      { ...CRIA_2, tipo_productivo_nombre: 'Recría', estado_vinculo_materno: 'finalizado' },
    ]
    // La action itera en orden; el primer bloqueador que encuentre detiene la operación
    const primerError = lote.flatMap(c => getWeaningBlockers(c))[0]
    expect(primerError).toBeDefined()
    expect(primerError).toMatch(/ya haya sido destetado/)
  })

  it('lote mixto (1ª muerta, 2ª válida): la 1ª bloquea antes de llegar a la 2ª', () => {
    const lote: CriaParaDestete[] = [
      { ...CRIA_ELEGIBLE, estado_vital: 'muerto' },
      CRIA_2,
    ]
    const primerError = lote.flatMap(c => getWeaningBlockers(c))[0]
    expect(primerError).toMatch(/muerto/)
  })

  it('lote de 3 crías, todas válidas: cero bloqueadores en total', () => {
    const lote: CriaParaDestete[] = [CRIA_ELEGIBLE, CRIA_2, { ...CRIA_2 }]
    const bloqueadores = lote.flatMap(c => getWeaningBlockers(c))
    expect(bloqueadores).toHaveLength(0)
  })

})
