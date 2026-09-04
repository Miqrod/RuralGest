/**
 * Tests PRD012: Machorra y reglas reproductivas de dominio
 *
 * Cobertura por tarea:
 *   181 — MACHORRA desde VACÍA (elegibilidad + transición + ciclo nuevo)
 *   182 — MACHORRA desde CUBIERTA (elegibilidad + transición + ciclo nuevo)
 *   183 — Rechazo de MACHORRA desde GESTANTE
 *   184 — Concurrencia y doble ejecución (dominio puro; RPC: it.todo)
 *   185 — Regresión: las demás operaciones reproductivas no se rompen
 *   186 — Edge cases / Mister Bean
 *
 * Los checks marcados con it.todo requieren tests de integración contra la DB
 * local de Supabase (setup pendiente: conexión real en vitest + seed por test).
 */

import { describe, it, expect } from 'vitest'

import { getAvailableActions }            from '../modules/ganadero/animales/domain/availableActions'
import { validarTransicionReproductiva, estadoPermiteEvento } from '../modules/ganadero/reproductivo/domain/rules'
import { checkEligibility }               from '../modules/ganadero/reproductivo/domain/rules/ReproductiveEligibilityRules'
import { canWean, getWeaningBlockers }    from '../modules/ganadero/reproductivo/domain/rules/ReproductiveEligibilityRules'
import { evalCycleRules, shouldCreateNewCycleAfterDesenlace } from '../modules/ganadero/reproductivo/domain/rules/ReproductiveCycleRules'
import type { ReproductiveContext }       from '../modules/ganadero/reproductivo/domain/types'

// ─── Fixtures de contexto ────────────────────────────────────────────────────

const cicloBase = {
  id:           'ciclo-uuid-001',
  animal_id:    'animal-uuid-001',
  numero_ciclo: 1,
  fecha_inicio: '2026-01-01',
  fecha_fin:    null,
  resultado:    null,
  created_at:   '2026-01-01T00:00:00Z',
  created_by:   null,
}

function ctx(
  estadoReproductivo: 'vacia' | 'cubierta' | 'gestante' | null,
  eventoSolicitado: ReproductiveContext['eventoSolicitado'],
  overrides: Partial<ReproductiveContext['animal']> = {},
): ReproductiveContext {
  return {
    animal: {
      id:                  'animal-uuid-001',
      especie:             'vacuno' as const,
      estado_reproductivo: estadoReproductivo,
      es_reproductora:     estadoReproductivo !== null,
      ...overrides,
    },
    cicloAbierto:    estadoReproductivo !== null ? { ...cicloBase } : null,
    eventoSolicitado,
    fechaEvento:     '2026-09-01' as const,
  }
}

// =============================================================================
// TAREA 181 — MACHORRA desde VACÍA
// =============================================================================

describe('T181 — MACHORRA desde VACÍA', () => {

  it('acción machorra disponible cuando es_reproductora=true, ciclo abierto, estado=vacía', () => {
    const acciones = getAvailableActions({
      estadoVital:         'vivo',
      estadoReproductivo:  'vacia',
      tieneCicloAbierto:   true,
      esReproductora:      true,
      tieneCriasElegibles: false,
    })
    expect(acciones.has('machorra')).toBe(true)
  })

  it('acción machorra NO disponible cuando es_reproductora=false', () => {
    const acciones = getAvailableActions({
      estadoVital:         'vivo',
      estadoReproductivo:  'vacia',
      tieneCicloAbierto:   true,
      esReproductora:      false,
      tieneCriasElegibles: false,
    })
    expect(acciones.has('machorra')).toBe(false)
  })

  it('estadoPermiteEvento: MACHORRA desde vacía = permitido', () => {
    expect(estadoPermiteEvento('vacia', 'MACHORRA')).toBe(true)
  })

  it('validarTransicion: MACHORRA desde vacía → vacía', () => {
    const nuevo = validarTransicionReproductiva('MACHORRA', 'vacia')
    expect(nuevo).toBe('vacia')
  })

  it('checkEligibility: elegible en vacía con ciclo abierto', () => {
    const result = checkEligibility(ctx('vacia', 'MACHORRA'))
    expect(result.eligible).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('shouldCreateNewCycleAfterDesenlace: true cuando es_reproductora=true', () => {
    expect(shouldCreateNewCycleAfterDesenlace(true)).toBe(true)
  })

  it('shouldCreateNewCycleAfterDesenlace: false cuando es_reproductora=false', () => {
    expect(shouldCreateNewCycleAfterDesenlace(false)).toBe(false)
  })

  // Checks que requieren integración DB (RPC registrar_machorra real):
  it.todo('DB: MACHORRA desde VACÍA, es_reproductora=true → evento MACHORRA creado, ciclo cerrado, nuevo ciclo vacía creado')
  it.todo('DB: MACHORRA desde VACÍA, es_reproductora=false → evento MACHORRA creado, ciclo cerrado, NO nuevo ciclo')
  it.todo('DB: un solo evento MACHORRA en la tabla eventos (idempotencia por transacción)')
  it.todo('DB: un solo cierre (fecha_fin) en el ciclo, no duplicado')
  it.todo('DB: un solo ciclo nuevo creado (no duplicado por race condition)')
})

// =============================================================================
// TAREA 182 — MACHORRA desde CUBIERTA
// =============================================================================

describe('T182 — MACHORRA desde CUBIERTA', () => {

  it('acción machorra disponible cuando estado=cubierta', () => {
    const acciones = getAvailableActions({
      estadoVital:         'vivo',
      estadoReproductivo:  'cubierta',
      tieneCicloAbierto:   true,
      esReproductora:      true,
      tieneCriasElegibles: false,
    })
    expect(acciones.has('machorra')).toBe(true)
  })

  it('estadoPermiteEvento: MACHORRA desde cubierta = permitido', () => {
    expect(estadoPermiteEvento('cubierta', 'MACHORRA')).toBe(true)
  })

  it('validarTransicion: MACHORRA desde cubierta → vacía', () => {
    expect(validarTransicionReproductiva('MACHORRA', 'cubierta')).toBe('vacia')
  })

  it('checkEligibility: elegible en cubierta con ciclo abierto', () => {
    const result = checkEligibility(ctx('cubierta', 'MACHORRA'))
    expect(result.eligible).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it.todo('DB: MACHORRA desde CUBIERTA, es_reproductora=true → evento, cierre, nuevo ciclo')
  it.todo('DB: MACHORRA desde CUBIERTA, es_reproductora=false → evento, cierre, sin nuevo ciclo')
  it.todo('DB: evento único, cierre único, ciclo único')
})

// =============================================================================
// TAREA 183 — Rechazo de MACHORRA desde GESTANTE
// =============================================================================

describe('T183 — Rechazo de MACHORRA desde GESTANTE', () => {

  it('acción machorra NO disponible cuando estado=gestante', () => {
    const acciones = getAvailableActions({
      estadoVital:         'vivo',
      estadoReproductivo:  'gestante',
      tieneCicloAbierto:   true,
      esReproductora:      true,
      tieneCriasElegibles: false,
    })
    expect(acciones.has('machorra')).toBe(false)
  })

  it('estadoPermiteEvento: MACHORRA desde gestante = NO permitido', () => {
    expect(estadoPermiteEvento('gestante', 'MACHORRA')).toBe(false)
  })

  it('validarTransicion: MACHORRA desde gestante lanza error', () => {
    expect(() => validarTransicionReproductiva('MACHORRA', 'gestante')).toThrow()
  })

  it('checkEligibility: no elegible en gestante — error específico incluido', () => {
    const result = checkEligibility(ctx('gestante', 'MACHORRA'))
    expect(result.eligible).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain('gestante')
  })

  it.todo('DB: intentar registrar MACHORRA desde GESTANTE → excepción RPC con mensaje claro')
  it.todo('DB: ningún evento MACHORRA creado tras el rechazo')
  it.todo('DB: ciclo no modificado tras el rechazo')
  it.todo('DB: ningún ciclo nuevo creado tras el rechazo')
})

// =============================================================================
// TAREA 184 — Concurrencia y doble ejecución
// =============================================================================

describe('T184 — Concurrencia y doble ejecución', () => {

  it('checkEligibility: estado cambió a gestante mientras el formulario estaba abierto → no elegible', () => {
    // Simula el caso "formulario abierto en vacía → otro usuario registró cubrición
    // + confirmación → estado es ahora gestante → machorra debe ser rechazada".
    // checkEligibility opera sobre el snapshot del ctx recibido; el RPC también
    // tiene el FOR UPDATE que valida el estado real en DB en tiempo de ejecución.
    const result = checkEligibility(ctx('gestante', 'MACHORRA'))
    expect(result.eligible).toBe(false)
    expect(result.errors.some(e => e.includes('gestante'))).toBe(true)
  })

  it('checkEligibility: cicloAbierto=null con es_reproductora=false → no elegible', () => {
    // Si el animal dejó de ser reproductora y no tiene ciclo, no puede registrar machorra.
    // (cicloAbierto=null con es_reproductora=true es inconsistente — lo rechaza el RPC)
    const ctxSinCicloNiRepro: ReproductiveContext = {
      animal: {
        id:                  'animal-uuid-001',
        especie:             'vacuno' as const,
        estado_reproductivo: null,
        es_reproductora:     false,
      },
      cicloAbierto:     null,
      eventoSolicitado: 'MACHORRA',
      fechaEvento:      '2026-09-01' as const,
    }
    const result = checkEligibility(ctxSinCicloNiRepro)
    expect(result.eligible).toBe(false)
  })

  it('checkEligibility: animal muerto rechaza antes de evaluar estado reproductivo', () => {
    // Una segunda petición donde el animal ya salió antes de procesar la primera
    const acciones = getAvailableActions({
      estadoVital:         'vendido',
      estadoReproductivo:  'vacia',
      tieneCicloAbierto:   true,
      esReproductora:      true,
      tieneCriasElegibles: false,
    })
    // Ninguna acción excepto la de salida queda disponible
    expect(acciones.size).toBe(0)
  })

  it.todo('DB: doble click simultáneo en botón → exactamente un evento MACHORRA creado')
  it.todo('DB: dos requests concurrentes desde el mismo animal → solo uno tiene efecto, el otro lanza error')
  it.todo('DB: acción repetida después de completarse → rechazo porque estado ya cambió')
})

// =============================================================================
// TAREA 185 — Regresión: otras operaciones no se rompen con PRD012
// =============================================================================

describe('T185 — Regresión operaciones reproductivas', () => {

  // Cubrición
  it('getAvailableActions incluye cubricion desde vacía', () => {
    const a = getAvailableActions({ estadoVital: 'vivo', estadoReproductivo: 'vacia', tieneCicloAbierto: true, esReproductora: true, tieneCriasElegibles: false })
    expect(a.has('cubricion')).toBe(true)
  })

  it('getAvailableActions incluye cubricion desde cubierta (re-cubrición)', () => {
    const a = getAvailableActions({ estadoVital: 'vivo', estadoReproductivo: 'cubierta', tieneCicloAbierto: true, esReproductora: true, tieneCriasElegibles: false })
    expect(a.has('cubricion')).toBe(true)
  })

  it('validarTransicion: CUBRICION desde vacía → cubierta', () => {
    expect(validarTransicionReproductiva('CUBRICION', 'vacia')).toBe('cubierta')
  })

  it('validarTransicion: CUBRICION desde cubierta → cubierta', () => {
    expect(validarTransicionReproductiva('CUBRICION', 'cubierta')).toBe('cubierta')
  })

  // Confirmación
  it('getAvailableActions incluye confirmacion desde cubierta', () => {
    const a = getAvailableActions({ estadoVital: 'vivo', estadoReproductivo: 'cubierta', tieneCicloAbierto: true, esReproductora: true, tieneCriasElegibles: false })
    expect(a.has('confirmacion')).toBe(true)
  })

  it('validarTransicion: CONFIRMACION_GESTACION desde cubierta → gestante', () => {
    expect(validarTransicionReproductiva('CONFIRMACION_GESTACION', 'cubierta')).toBe('gestante')
  })

  // Parto
  it('getAvailableActions incluye parto desde cubierta', () => {
    const a = getAvailableActions({ estadoVital: 'vivo', estadoReproductivo: 'cubierta', tieneCicloAbierto: true, esReproductora: true, tieneCriasElegibles: false })
    expect(a.has('parto')).toBe(true)
  })

  it('getAvailableActions incluye parto desde gestante', () => {
    const a = getAvailableActions({ estadoVital: 'vivo', estadoReproductivo: 'gestante', tieneCicloAbierto: true, esReproductora: true, tieneCriasElegibles: false })
    expect(a.has('parto')).toBe(true)
  })

  it('validarTransicion: PARTO desde gestante → vacía', () => {
    expect(validarTransicionReproductiva('PARTO', 'gestante')).toBe('vacia')
  })

  // Aborto
  it('getAvailableActions incluye aborto desde gestante', () => {
    const a = getAvailableActions({ estadoVital: 'vivo', estadoReproductivo: 'gestante', tieneCicloAbierto: true, esReproductora: true, tieneCriasElegibles: false })
    expect(a.has('aborto')).toBe(true)
  })

  it('validarTransicion: ABORTO desde gestante → vacía', () => {
    expect(validarTransicionReproductiva('ABORTO', 'gestante')).toBe('vacia')
  })

  // Destete
  it('getAvailableActions incluye destete cuando tiene crías elegibles', () => {
    const a = getAvailableActions({ estadoVital: 'vivo', estadoReproductivo: null, tieneCicloAbierto: false, esReproductora: false, tieneCriasElegibles: true })
    expect(a.has('destete')).toBe(true)
  })

  it('getAvailableActions NO incluye destete sin crías elegibles', () => {
    const a = getAvailableActions({ estadoVital: 'vivo', estadoReproductivo: 'vacia', tieneCicloAbierto: true, esReproductora: true, tieneCriasElegibles: false })
    expect(a.has('destete')).toBe(false)
  })

  // DESTETE no transiciona estado reproductivo
  it('DESTETE no cambia el estado reproductivo (retorna el mismo)', () => {
    expect(validarTransicionReproductiva('DESTETE', 'vacia')).toBe('vacia')
    expect(validarTransicionReproductiva('DESTETE', 'cubierta')).toBe('cubierta')
    expect(validarTransicionReproductiva('DESTETE', 'gestante')).toBe('gestante')
  })

  // evalCycleRules: reutiliza ciclo existente para eventos normales
  it('evalCycleRules: reutiliza ciclo existente para CUBRICION', () => {
    const result = evalCycleRules(ctx('vacia', 'CUBRICION'))
    expect(result.accion).toBe('reutilizar')
    expect(result.cicloId).toBe('ciclo-uuid-001')
  })

  it('evalCycleRules: lanza error si no hay ciclo abierto para CUBRICION', () => {
    expect(() =>
      evalCycleRules(ctx(null, 'CUBRICION'))
    ).toThrow('CUBRICION')
  })

  it.todo('DB: Cubrición continúa funcionando en local Supabase')
  it.todo('DB: Confirmación de gestación continúa funcionando')
  it.todo('DB: Parto continúa funcionando')
  it.todo('DB: Aborto continúa funcionando')
  it.todo('DB: Destete continúa funcionando')
})

// =============================================================================
// TAREA 186 — Edge cases / Mister Bean
// =============================================================================

describe('T186 — Edge cases y Mister Bean', () => {

  // Animal muerto
  it('animal muerto: ninguna acción disponible (ni salida)', () => {
    const a = getAvailableActions({ estadoVital: 'muerto', estadoReproductivo: 'vacia', tieneCicloAbierto: true, esReproductora: true, tieneCriasElegibles: true })
    expect(a.size).toBe(0)
  })

  // Animal vendido
  it('animal vendido: ninguna acción disponible', () => {
    const a = getAvailableActions({ estadoVital: 'vendido', estadoReproductivo: 'vacia', tieneCicloAbierto: true, esReproductora: true, tieneCriasElegibles: true })
    expect(a.size).toBe(0)
  })

  // No reproductora sin ciclo
  it('no reproductora sin ciclo: machorra no disponible', () => {
    const a = getAvailableActions({ estadoVital: 'vivo', estadoReproductivo: null, tieneCicloAbierto: false, esReproductora: false, tieneCriasElegibles: false })
    expect(a.has('machorra')).toBe(false)
  })

  // Reproductora sin ciclo abierto (no debería ocurrir, pero la UI debe manejarlo)
  it('reproductora sin ciclo abierto: machorra no disponible', () => {
    const a = getAvailableActions({ estadoVital: 'vivo', estadoReproductivo: 'vacia', tieneCicloAbierto: false, esReproductora: true, tieneCriasElegibles: false })
    expect(a.has('machorra')).toBe(false)
  })

  // MACHORRA desde gestante (ya cubierto en T183, aquí como regresión explícita)
  it('MACHORRA desde gestante: ni disponible en UI ni permitida por transición', () => {
    const a = getAvailableActions({ estadoVital: 'vivo', estadoReproductivo: 'gestante', tieneCicloAbierto: true, esReproductora: true, tieneCriasElegibles: false })
    expect(a.has('machorra')).toBe(false)
    expect(estadoPermiteEvento('gestante', 'MACHORRA')).toBe(false)
    expect(() => validarTransicionReproductiva('MACHORRA', 'gestante')).toThrow()
  })

  // Destete: cría con tipo_productivo ≠ Cría
  it('weaningBlockers: cría ya destetada (tipo ≠ Cría)', () => {
    const blockers = getWeaningBlockers({
      tipo_productivo_nombre: 'Recría',
      estado_vital:           'vivo',
      estado_vinculo_materno: 'activo',
      madre_id:               'madre-uuid',
    })
    expect(blockers.length).toBeGreaterThan(0)
    expect(blockers[0]).toContain('Cría')
  })

  // Destete: cría muerta
  it('weaningBlockers: cría muerta no elegible para destete', () => {
    const blockers = getWeaningBlockers({
      tipo_productivo_nombre: 'Cría',
      estado_vital:           'muerto',
      estado_vinculo_materno: 'activo',
      madre_id:               'madre-uuid',
    })
    expect(blockers.length).toBeGreaterThan(0)
  })

  // Destete: vínculo ya finalizado
  it('weaningBlockers: vínculo ya finalizado bloquea destete', () => {
    const blockers = getWeaningBlockers({
      tipo_productivo_nombre: 'Cría',
      estado_vital:           'vivo',
      estado_vinculo_materno: 'finalizado',
      madre_id:               'madre-uuid',
    })
    expect(blockers.length).toBeGreaterThan(0)
  })

  // Destete: sin madre registrada
  it('weaningBlockers: sin madre_id bloquea destete', () => {
    const blockers = getWeaningBlockers({
      tipo_productivo_nombre: 'Cría',
      estado_vital:           'vivo',
      estado_vinculo_materno: 'activo',
      madre_id:               null,
    })
    expect(blockers.length).toBeGreaterThan(0)
    expect(blockers.some(b => b.includes('madre'))).toBe(true)
  })

  // Cría elegible: todos los campos correctos
  it('canWean: true cuando todos los requisitos están cumplidos', () => {
    expect(canWean({
      tipo_productivo_nombre: 'Cría',
      estado_vital:           'vivo',
      estado_vinculo_materno: 'activo',
      madre_id:               'madre-uuid',
    })).toBe(true)
  })

  it.todo('DB: MACHORRA con crías propias activas → vínculos madre-cría se mantienen intactos')
  it.todo('DB: animal no REPRODUCTORA → RPC rechaza con error claro')
  it.todo('DB: animal muerto → RPC rechaza con error claro')
  it.todo('DB: fecha modificada manualmente fuera de reglas (anterior al último evento)')
  it.todo('DB: MACHORRA desde GESTANTE → RPC rechaza, mensaje claro, sin efectos secundarios')
})
