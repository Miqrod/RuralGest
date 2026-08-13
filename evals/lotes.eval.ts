import { describe, it, expect } from 'vitest'

import {
  assertStockDisponible,
  assertLoteActivo,
} from '@/modules/ganadero/lotes/domain/rules'

// =============================================================================
// EVAL: Lotes — reglas de integridad de stock y estado de lote
//
// Un lote es un grupo lógico de animales. Los movimientos entre lotes
// (entrada, salida, traslado) deben cumplir dos invariantes básicos:
//
//   1. No dejar el stock en negativo: no se pueden sacar más animales
//      de los que hay en el lote origen.
//   2. Solo lotes activos participan en movimientos: un lote cerrado o
//      archivado no puede recibir ni ceder animales.
// =============================================================================

// ── assertStockDisponible ─────────────────────────────────────────────────────

describe('EVAL: Lotes — assertStockDisponible', () => {

  it('cantidad 3, disponible 10 → válido (caso normal, hay margen suficiente)', () => {
    // El movimiento más habitual: sacar un subconjunto de animales del lote.
    // Debe pasar sin ningún error.
    expect(() => assertStockDisponible(3, 10)).not.toThrow()
  })

  it('cantidad igual al disponible → válido (se vacía el lote por completo)', () => {
    // Caso límite: el ganadero transfiere todos los animales del lote.
    // Es una operación válida (p.ej. venta total de un lote o traslado completo).
    // La regla no debe rechazar este caso porque cantidad == disponible.
    expect(() => assertStockDisponible(10, 10)).not.toThrow()
  })

  it('cantidad mayor que el disponible → lanza (stock insuficiente)', () => {
    // No se pueden sacar más animales de los que existen en el lote.
    // Romper este invariante dejaría el stock en negativo, lo que carece de
    // sentido físico y corrompería los contadores de censo.
    expect(() => assertStockDisponible(11, 10)).toThrow(/insuficiente/)
  })

  it('cantidad 0 → lanza (mover cero animales no es una operación válida)', () => {
    // Un movimiento de 0 unidades no representa ningún cambio real.
    // Podría colarse por un formulario vacío o un bug; la regla lo rechaza.
    expect(() => assertStockDisponible(0, 10)).toThrow(/[Cc]antidad/)
  })

  it('cantidad negativa → lanza (físicamente imposible)', () => {
    // Una cantidad negativa no tiene interpretación válida en ganadería.
    // Las correcciones de stock se modelan como movimientos de signo contrario
    // (entrada en lugar de salida), nunca como cantidades negativas.
    expect(() => assertStockDisponible(-1, 10)).toThrow(/[Cc]antidad/)
  })

})

// ── assertLoteActivo ──────────────────────────────────────────────────────────

describe('EVAL: Lotes — assertLoteActivo', () => {

  it('estado "activo" → válido (el lote puede participar en movimientos)', () => {
    // Solo los lotes activos pueden recibir o ceder animales.
    // Este es el único estado que habilita el módulo de movimientos.
    expect(() => assertLoteActivo('activo')).not.toThrow()
  })

  it('estado "cerrado" → lanza (un lote cerrado ya no gestiona stock)', () => {
    // Un lote se cierra cuando termina su ciclo productivo (p.ej. todos los animales
    // han salido). Intentar mover animales hacia/desde él es un error de flujo.
    expect(() => assertLoteActivo('cerrado')).toThrow(/activo/)
  })

  it('estado "archivado" → lanza (un lote archivado es solo histórico)', () => {
    // Los lotes archivados son registros históricos de solo lectura.
    // Ningún movimiento de stock puede afectarlos.
    expect(() => assertLoteActivo('archivado')).toThrow(/activo/)
  })

})
