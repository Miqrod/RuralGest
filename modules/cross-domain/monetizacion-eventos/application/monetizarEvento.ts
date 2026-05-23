import type { MonetizacionEventoInput, MonetizacionEventoResult } from '../domain/types'

/**
 * Puente GANADERO ↔ FINANCIERO.
 * Transforma un evento de venta en una transacción de previsión.
 * Nunca se invoca automáticamente — siempre requiere acción explícita del usuario.
 */
export async function monetizarEvento(
  _input: MonetizacionEventoInput,
): Promise<MonetizacionEventoResult> {
  // 1. Fetch evento → assert tipo SALIDA y motivo.es_monetizable
  // 2. Fetch venta_linea del evento → obtener venta.cliente_id
  // 3. Crear transaccion: origen='prevision', venta_id, tipo='ingreso'
  // 4. Retornar transaccion_id + importe
  throw new Error('not implemented')
}
