import { describe, it, expect } from 'vitest'
import {
  filtrarEnRevision,
  type RawAnimalRevision,
  type RawCicloRevision,
} from '@/modules/ganadero/reproductivo/application/queries/getRevisionReproductiva'

// =============================================================================
// EVAL: Revisión reproductiva — lógica pura de filtrarEnRevision
//
// Reglas de dominio probadas:
//   1. Umbral estricto: solo animales con diasEnCiclo > umbralDias entran
//   2. Deduplicación: cuando un animal tiene varios ciclos abiertos, solo
//      cuenta el más reciente (primer numero_ciclo al llegar ordenados DESC)
//   3. Cálculo de días: normalizado a medianoche — replica CURRENT_DATE - fecha_inicio
//   4. Ordenación: más días en ciclo primero (urgencia descendente)
//   5. Edge cases: sin animales, sin ciclos, animal sin ciclo en el mapa
//
// Sin acceso a BD — toda la lógica es pura.
// =============================================================================

// ── Helpers ───────────────────────────────────────────────────────────────────

// Formatea una Date como "YYYY-MM-DD" usando componentes locales.
// No usar toISOString(): convierte a UTC y puede desfasar el día en timezones +offset.
function toLocalISODate(d: Date): string {
  const y  = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dy = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${dy}`
}

// Construye una fecha de inicio que resulte exactamente en N días antes de hoy.
// Usa aritmética local para que filtrarEnRevision calcule exactamente N días.
function fechaHaceNDias(hoy: Date, n: number): string {
  const d = new Date(hoy)
  d.setDate(d.getDate() - n)
  return toLocalISODate(d)
}

function animal(id: string, estado: 'vacia' | 'cubierta' = 'vacia'): RawAnimalRevision {
  return { id, crotal: `ES${id.slice(-3)}`, nombre: null, estado_reproductivo: estado }
}

function ciclo(animalId: string, numero: number, diasAtras: number, hoy: Date): RawCicloRevision {
  return {
    id:           `ciclo-${animalId}-${numero}`,
    animal_id:    animalId,
    fecha_inicio: fechaHaceNDias(hoy, diasAtras),
    numero_ciclo: numero,
  }
}

// new Date(year, month-1, day) crea fecha LOCAL (no UTC) → sin desfase de timezone.
// filtrarEnRevision también normaliza a medianoche local con setHours(0,0,0,0).
const HOY = new Date(2026, 8, 28) // 28 sep 2026, medianoche local
const UMBRAL = 60

// ── 1. Filtrado por umbral ────────────────────────────────────────────────────

describe('EVAL: filtrarEnRevision — filtrado por umbral', () => {

  it('animal con exactamente umbralDias NO supera el umbral (condición estricta >)', () => {
    // diasEnCiclo === umbralDias no es suficiente — se necesita > umbralDias
    const resultado = filtrarEnRevision(
      [animal('a1')],
      [ciclo('a1', 1, UMBRAL, HOY)],
      UMBRAL,
      HOY,
    )
    expect(resultado).toHaveLength(0)
  })

  it('animal con umbralDias + 1 sí supera el umbral', () => {
    const resultado = filtrarEnRevision(
      [animal('a1')],
      [ciclo('a1', 1, UMBRAL + 1, HOY)],
      UMBRAL,
      HOY,
    )
    expect(resultado).toHaveLength(1)
    expect(resultado[0].dias_en_ciclo).toBe(UMBRAL + 1)
  })

  it('animal con pocos días en ciclo no aparece aunque haya otros que sí superan', () => {
    const resultado = filtrarEnRevision(
      [animal('a1'), animal('a2')],
      [
        ciclo('a1', 1, UMBRAL + 30, HOY),
        ciclo('a2', 1, 10,          HOY),
      ],
      UMBRAL,
      HOY,
    )
    expect(resultado).toHaveLength(1)
    expect(resultado[0].id).toBe('a1')
  })

  it('todos los animales bajo el umbral devuelve lista vacía', () => {
    const resultado = filtrarEnRevision(
      [animal('a1'), animal('a2')],
      [
        ciclo('a1', 1, 5,  HOY),
        ciclo('a2', 1, 30, HOY),
      ],
      UMBRAL,
      HOY,
    )
    expect(resultado).toHaveLength(0)
  })

})

// ── 2. Deduplicación de ciclos ────────────────────────────────────────────────

describe('EVAL: filtrarEnRevision — deduplicación (un ciclo por animal)', () => {

  it('animal con dos ciclos abiertos: solo cuenta el primero de la lista (numero_ciclo DESC)', () => {
    // La query envía los ciclos ordenados por numero_ciclo DESC.
    // El primero en la lista para cada animal_id es el más reciente.
    // ciclo 2 tiene 90 días (supera umbral); ciclo 1 tiene 20 días (no supera).
    // Al llegar ordenados DESC el ciclo 2 llega primero → debe ser el que cuenta.
    const resultado = filtrarEnRevision(
      [animal('a1')],
      [
        ciclo('a1', 2, 90, HOY),  // más reciente — llega primero en la lista
        ciclo('a1', 1, 20, HOY),  // más antiguo — ignorado
      ],
      UMBRAL,
      HOY,
    )
    expect(resultado).toHaveLength(1)
    expect(resultado[0].dias_en_ciclo).toBe(90)
  })

  it('si el ciclo más reciente no supera el umbral, el animal no aparece aunque el antiguo sí', () => {
    // ciclo 2 tiene 20 días (no supera); ciclo 1 tiene 90 días (sí supera pero es ignorado)
    const resultado = filtrarEnRevision(
      [animal('a1')],
      [
        ciclo('a1', 2, 20, HOY),  // más reciente — no supera umbral
        ciclo('a1', 1, 90, HOY),  // más antiguo — ignorado
      ],
      UMBRAL,
      HOY,
    )
    expect(resultado).toHaveLength(0)
  })

})

// ── 3. Cálculo de días ────────────────────────────────────────────────────────

describe('EVAL: filtrarEnRevision — cálculo de días en ciclo', () => {

  it('dias_en_ciclo es exactamente el número de días naturales desde fecha_inicio', () => {
    const dias = 75
    const resultado = filtrarEnRevision(
      [animal('a1')],
      [ciclo('a1', 1, dias, HOY)],
      UMBRAL,
      HOY,
    )
    expect(resultado[0].dias_en_ciclo).toBe(dias)
  })

  it('fecha_inicio_ciclo se propaga correctamente al resultado', () => {
    const fechaInicio = fechaHaceNDias(HOY, 80)
    const resultado = filtrarEnRevision(
      [animal('a1')],
      [{ id: 'c1', animal_id: 'a1', fecha_inicio: fechaInicio, numero_ciclo: 1 }],
      UMBRAL,
      HOY,
    )
    expect(resultado[0].fecha_inicio_ciclo).toBe(fechaInicio)
  })

  it('estado_reproductivo del animal se propaga al resultado', () => {
    const resultado = filtrarEnRevision(
      [animal('a1', 'cubierta')],
      [ciclo('a1', 1, 80, HOY)],
      UMBRAL,
      HOY,
    )
    expect(resultado[0].estado_reproductivo).toBe('cubierta')
  })

})

// ── 4. Ordenación ─────────────────────────────────────────────────────────────

describe('EVAL: filtrarEnRevision — ordenación por urgencia', () => {

  it('el animal con más días en ciclo aparece primero', () => {
    const resultado = filtrarEnRevision(
      [animal('a1'), animal('a2'), animal('a3')],
      [
        ciclo('a1', 1, 65,  HOY),
        ciclo('a2', 1, 120, HOY),
        ciclo('a3', 1, 90,  HOY),
      ],
      UMBRAL,
      HOY,
    )
    expect(resultado.map(r => r.id)).toEqual(['a2', 'a3', 'a1'])
    expect(resultado[0].dias_en_ciclo).toBeGreaterThan(resultado[1].dias_en_ciclo)
    expect(resultado[1].dias_en_ciclo).toBeGreaterThan(resultado[2].dias_en_ciclo)
  })

  it('dos animales con el mismo número de días mantienen un orden estable', () => {
    const resultado = filtrarEnRevision(
      [animal('a1'), animal('a2')],
      [
        ciclo('a1', 1, 80, HOY),
        ciclo('a2', 1, 80, HOY),
      ],
      UMBRAL,
      HOY,
    )
    expect(resultado).toHaveLength(2)
    expect(resultado[0].dias_en_ciclo).toBe(80)
    expect(resultado[1].dias_en_ciclo).toBe(80)
  })

})

// ── 5. Edge cases ─────────────────────────────────────────────────────────────

describe('EVAL: filtrarEnRevision — edge cases', () => {

  it('lista de animales vacía devuelve array vacío', () => {
    expect(filtrarEnRevision([], [], UMBRAL, HOY)).toEqual([])
  })

  it('lista de ciclos vacía devuelve array vacío aunque haya animales', () => {
    expect(filtrarEnRevision([animal('a1')], [], UMBRAL, HOY)).toEqual([])
  })

  it('animal sin ciclo en el mapa es ignorado (sin error)', () => {
    // a2 no tiene ciclo — no debe lanzar ni aparecer en el resultado
    const resultado = filtrarEnRevision(
      [animal('a1'), animal('a2')],
      [ciclo('a1', 1, 80, HOY)],
      UMBRAL,
      HOY,
    )
    expect(resultado).toHaveLength(1)
    expect(resultado[0].id).toBe('a1')
  })

  it('umbral = 0: todos los animales con ciclo activo aparecen (diasEnCiclo > 0)', () => {
    // diasEnCiclo = 1 > 0 → aparece
    const resultado = filtrarEnRevision(
      [animal('a1')],
      [ciclo('a1', 1, 1, HOY)],
      0,
      HOY,
    )
    expect(resultado).toHaveLength(1)
  })

  it('animal con ciclo que empieza hoy tiene diasEnCiclo = 0 → no supera ningún umbral positivo', () => {
    const resultado = filtrarEnRevision(
      [animal('a1')],
      [ciclo('a1', 1, 0, HOY)],
      0,
      HOY,
    )
    // 0 > 0 es false
    expect(resultado).toHaveLength(0)
  })

})
