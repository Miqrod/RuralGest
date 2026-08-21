import { describe, it, expect } from 'vitest'

import {
  assertVentaTieneLineas,
  assertLineaCoherente,
} from '@/modules/financiero/ventas/domain/rules'
import type { CrearVentaInput } from '@/modules/financiero/ventas/domain/types'

// =============================================================================
// EVAL: Ventas — reglas de integridad de la entidad Venta
//
// Una Venta es un documento económico que agrupa líneas de venta.
// Cada línea (VentaLinea) es el puente entre el módulo ganadero y el financiero:
//   - animal_id o lote_id  → qué se vendió (referencia al módulo ganadero)
//   - evento_id            → el evento de salida que generó la línea
//   - cantidad             → cuántas unidades
//
// Invariante crítico de arquitectura: la venta_linea es el único puente entre
// GANADERO y FINANCIERO. Estas reglas protegen su coherencia antes de persistir.
// =============================================================================

type Linea = CrearVentaInput['lineas'][number]

// ── Fixtures ─────────────────────────────────────────────────────────────────

const LINEA_ANIMAL: Linea = {
  evento_id: 'uuid-evento',
  tipo:      'animal',
  animal_id: 'uuid-animal',
  cantidad:  1,
}

const LINEA_LOTE: Linea = {
  evento_id: 'uuid-evento',
  tipo:      'lote',
  lote_id:   'uuid-lote',
  cantidad:  5,
}

// ── assertVentaTieneLineas ────────────────────────────────────────────────────

describe('EVAL: Ventas — assertVentaTieneLineas', () => {

  it('venta con una línea → válida', () => {
    // Caso mínimo válido: toda venta debe tener al menos una línea.
    // Una venta sin líneas no tiene sentido económico ni de trazabilidad.
    expect(() => assertVentaTieneLineas({ lineas: [LINEA_ANIMAL] } as CrearVentaInput))
      .not.toThrow()
  })

  it('venta con múltiples líneas → válida', () => {
    // Una misma venta puede incluir animales sueltos y/o lotes.
    // Es el caso habitual cuando el comprador adquiere varios grupos.
    expect(() => assertVentaTieneLineas({ lineas: [LINEA_ANIMAL, LINEA_LOTE] } as CrearVentaInput))
      .not.toThrow()
  })

  it('venta sin líneas → lanza', () => {
    // Una venta vacía no tiene ningún significado financiero ni ganadero.
    // Podría ocurrir por un bug en el formulario o una llamada incorrecta a la API.
    expect(() => assertVentaTieneLineas({ lineas: [] } as unknown as CrearVentaInput))
      .toThrow(/al menos una línea/)
  })

})

// ── assertLineaCoherente ──────────────────────────────────────────────────────

describe('EVAL: Ventas — assertLineaCoherente', () => {

  it('línea tipo "animal" con animal_id → válida', () => {
    // Una línea de animal debe referenciar exactamente qué animal se vendió.
    // Sin animal_id la trazabilidad ganadero→financiero queda rota.
    expect(() => assertLineaCoherente(LINEA_ANIMAL)).not.toThrow()
  })

  it('línea tipo "animal" sin animal_id → lanza', () => {
    // Si el tipo es 'animal' pero falta el id, el sistema no puede trazar
    // qué animal concreto se vendió. Rompe el invariante de trazabilidad.
    const linea: Linea = { ...LINEA_ANIMAL, animal_id: undefined }
    expect(() => assertLineaCoherente(linea)).toThrow(/animal_id/)
  })

  it('línea tipo "lote" con lote_id → válida', () => {
    // Análogo al caso de animal: la línea de lote debe referenciar el lote correcto.
    expect(() => assertLineaCoherente(LINEA_LOTE)).not.toThrow()
  })

  it('línea tipo "lote" sin lote_id → lanza', () => {
    // Sin lote_id no se puede actualizar el stock del lote ni rastrear la venta.
    const linea: Linea = { ...LINEA_LOTE, lote_id: undefined }
    expect(() => assertLineaCoherente(linea)).toThrow(/lote_id/)
  })

  it('cantidad 1 → válida (mínimo significativo)', () => {
    // Una unidad es la cantidad mínima con sentido en una transacción ganadera.
    expect(() => assertLineaCoherente({ ...LINEA_ANIMAL, cantidad: 1 })).not.toThrow()
  })

  it('cantidad 0 → lanza (vender cero unidades no tiene sentido)', () => {
    // Una línea con cantidad 0 no representa ningún movimiento real de animales.
    // Podría colarse por un bug en el formulario (value inicial sin rellenar).
    expect(() => assertLineaCoherente({ ...LINEA_ANIMAL, cantidad: 0 }))
      .toThrow(/cantidad/)
  })

  it('cantidad negativa → lanza (físicamente imposible)', () => {
    // Una cantidad negativa no tiene interpretación válida en el dominio ganadero.
    // Las devoluciones o correcciones se modelan como eventos distintos, no como
    // cantidades negativas en la misma línea.
    expect(() => assertLineaCoherente({ ...LINEA_ANIMAL, cantidad: -1 }))
      .toThrow(/cantidad/)
  })

})
