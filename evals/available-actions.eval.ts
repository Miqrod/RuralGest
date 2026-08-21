import { describe, it, expect } from 'vitest'
import { getAvailableActions } from '@/modules/ganadero/animales/domain/availableActions'

// =============================================================================
// EVAL: AvailableActions — proyección contextual de acciones disponibles
//
// getAvailableActions es la única fuente de verdad sobre qué botones aparecen
// en la ficha de un animal. Estas reglas deben preservarse ante cualquier
// cambio en el modelo reproductivo o en el estado vital del animal.
// =============================================================================

const BASE = {
  estadoVital:         'vivo'   as const,
  estadoReproductivo:  null,
  tieneCicloAbierto:   false,
  esReproductora:      false,
  tieneCriasElegibles: false,
}

describe('EVAL: AvailableActions — animal no vivo', () => {

  it('animal muerto → sin acciones', () => {
    const acciones = getAvailableActions({ ...BASE, estadoVital: 'muerto' })
    expect(acciones.size).toBe(0)
  })

  it('animal vendido → sin acciones', () => {
    const acciones = getAvailableActions({ ...BASE, estadoVital: 'vendido' })
    expect(acciones.size).toBe(0)
  })

})

describe('EVAL: AvailableActions — animal vivo sin módulo reproductivo', () => {

  it('vivo sin ciclo → solo salida', () => {
    const acciones = getAvailableActions({ ...BASE })
    expect(acciones).toEqual(new Set(['salida']))
  })

})

describe('EVAL: AvailableActions — estados reproductivos', () => {

  it('vacía con ciclo → salida + cubrición + confirmación', () => {
    const acciones = getAvailableActions({
      ...BASE,
      estadoReproductivo:  'vacia',
      tieneCicloAbierto:   true,
    })
    expect(acciones.has('salida')).toBe(true)
    expect(acciones.has('cubricion')).toBe(true)
    expect(acciones.has('confirmacion')).toBe(true)
    expect(acciones.has('parto')).toBe(false)
    expect(acciones.has('destete')).toBe(false)
  })

  it('cubierta con ciclo → salida + cubrición + confirmación + parto', () => {
    const acciones = getAvailableActions({
      ...BASE,
      estadoReproductivo:  'cubierta',
      tieneCicloAbierto:   true,
    })
    expect(acciones.has('salida')).toBe(true)
    expect(acciones.has('cubricion')).toBe(true)
    expect(acciones.has('confirmacion')).toBe(true)
    expect(acciones.has('parto')).toBe(true)
    expect(acciones.has('destete')).toBe(false)
  })

  it('gestante con ciclo → salida + parto (no cubrición, no confirmación)', () => {
    const acciones = getAvailableActions({
      ...BASE,
      estadoReproductivo:  'gestante',
      tieneCicloAbierto:   true,
    })
    expect(acciones.has('salida')).toBe(true)
    expect(acciones.has('cubricion')).toBe(false)
    expect(acciones.has('confirmacion')).toBe(false)
    expect(acciones.has('parto')).toBe(true)
    expect(acciones.has('destete')).toBe(false)
  })

})

describe('EVAL: AvailableActions — destete', () => {

  it('reproductora con crías elegibles → incluye destete', () => {
    const acciones = getAvailableActions({
      ...BASE,
      esReproductora:      true,
      tieneCriasElegibles: true,
    })
    expect(acciones.has('destete')).toBe(true)
  })

  it('reproductora sin crías elegibles → no destete', () => {
    const acciones = getAvailableActions({
      ...BASE,
      esReproductora:      true,
      tieneCriasElegibles: false,
    })
    expect(acciones.has('destete')).toBe(false)
  })

  it('no reproductora con crías elegibles → destete disponible', () => {
    // Madre que cambió a tipo productivo no-reproductora pero tiene crías
    // con vínculo activo. El gate de es_reproductora fue eliminado: el destete
    // depende solo de que existan crías elegibles (tipo='Cría', vinculo='activo').
    const acciones = getAvailableActions({
      ...BASE,
      esReproductora:      false,
      tieneCriasElegibles: true,
    })
    expect(acciones.has('destete')).toBe(true)
  })

})

describe('EVAL: AvailableActions — invariante: ciclo cerrado bloquea reproductivos', () => {

  it('estado reproductivo presente pero sin ciclo abierto → no acciones reproductivas', () => {
    // Escenario PRD-CORRECTIVO: ciclo con resultado='parto' pendiente de destetes.
    // getCicloAbierto filtra resultado IS NULL, por lo que tieneCicloAbierto=false.
    const acciones = getAvailableActions({
      ...BASE,
      estadoReproductivo:  'vacia',
      tieneCicloAbierto:   false,
    })
    expect(acciones.has('cubricion')).toBe(false)
    expect(acciones.has('confirmacion')).toBe(false)
    expect(acciones.has('parto')).toBe(false)
  })

})
