import { describe, it, expect } from 'vitest'

import { assertTransaccionCoherente } from '@/modules/financiero/transacciones/domain/rules'
import type { CrearTransaccionInput } from '@/modules/financiero/transacciones/domain/types'

// =============================================================================
// EVAL: Transacciones — reglas de integridad del registro financiero
//
// Las transacciones son HECHOS HISTÓRICOS INMUTABLES. Una vez creadas no se
// editan; las correcciones generan nuevas transacciones.
//
// assertTransaccionCoherente es la primera línea de defensa antes de persistir.
// Valida tres invariantes:
//   1. Si origen='prevision', debe existir venta_id (la transacción referencia una venta).
//   2. Si origen='factura',   debe existir factura_id (referencia un documento externo).
//   3. El importe debe ser >= 0. La dirección del dinero la indica el campo 'tipo'
//      ('ingreso' o 'gasto'), nunca el signo del importe.
// =============================================================================

// ── Fixture base ──────────────────────────────────────────────────────────────

const BASE_TRANSACCION: CrearTransaccionInput = {
  tipo:         'ingreso',
  origen:       'manual',
  tercero_id:   'uuid-tercero',
  categoria_id: 'uuid-categoria',
  importe:      100,
  fecha:        '2026-07-01',
  descripcion:  'Venta de terneros',
}

// ── assertTransaccionCoherente ────────────────────────────────────────────────

describe('EVAL: Transacciones — assertTransaccionCoherente', () => {

  it('transacción manual válida → no lanza (caso base sin referencias externas)', () => {
    // origen='manual' no requiere ni venta_id ni factura_id.
    // Es el tipo más común para gastos registrados manualmente por el ganadero.
    expect(() => assertTransaccionCoherente(BASE_TRANSACCION)).not.toThrow()
  })

  it('origen "prevision" con venta_id → válida', () => {
    // Las transacciones de previsión anticipan cobros futuros de una venta concreta.
    // Deben referenciar esa venta para mantener la trazabilidad financiera.
    expect(() => assertTransaccionCoherente({
      ...BASE_TRANSACCION,
      origen:   'prevision',
      venta_id: 'uuid-venta',
    })).not.toThrow()
  })

  it('origen "prevision" sin venta_id → lanza', () => {
    // Una previsión sin venta asociada es un registro huérfano: no se puede reconciliar
    // con ningún cobro real ni incluir en el análisis de flujo de caja.
    expect(() => assertTransaccionCoherente({
      ...BASE_TRANSACCION,
      origen: 'prevision',
    })).toThrow(/venta_id/)
  })

  it('origen "factura" con factura_id → válida', () => {
    // Las transacciones de factura derivan de un documento externo (factura del proveedor
    // o del cliente). El factura_id es el enlace entre el registro financiero y el documento.
    expect(() => assertTransaccionCoherente({
      ...BASE_TRANSACCION,
      origen:     'factura',
      factura_id: 'uuid-factura',
    })).not.toThrow()
  })

  it('origen "factura" sin factura_id → lanza', () => {
    // Sin factura_id no hay fuente de verdad económica a la que referirse.
    // Estaríamos creando un movimiento financiero sin justificante documental.
    expect(() => assertTransaccionCoherente({
      ...BASE_TRANSACCION,
      origen: 'factura',
    })).toThrow(/factura_id/)
  })

  it('importe 0 → válido (ajustes y correcciones pueden tener importe cero)', () => {
    // Un importe de 0 puede ser legítimo en correcciones que cancelan un apunte previo
    // o en ajustes contables. La regla solo prohíbe valores negativos.
    expect(() => assertTransaccionCoherente({ ...BASE_TRANSACCION, importe: 0 })).not.toThrow()
  })

  it('importe negativo → lanza', () => {
    // La dirección del dinero se expresa con el campo 'tipo' (ingreso/gasto), no con
    // el signo del importe. Un importe negativo sería ambiguo y rompe este modelo.
    // Ejemplo incorrecto: gasto=-50 | correcto: tipo='gasto', importe=50.
    expect(() => assertTransaccionCoherente({ ...BASE_TRANSACCION, importe: -1 }))
      .toThrow(/importe/)
  })

})
