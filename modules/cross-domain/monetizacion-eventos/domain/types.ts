import type { UUID } from '../../../shared/types'

export interface MonetizacionEventoInput {
  evento_id: UUID
  venta_id: UUID
}

export interface MonetizacionEventoResult {
  transaccion_id: UUID
  importe: number
}
