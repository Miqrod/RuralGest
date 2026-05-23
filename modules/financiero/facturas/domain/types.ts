import type { UUID, ISODate, ISOTimestamp } from '../../../shared/types'
import type { TipoFinanciero } from '../../shared/domain/types'

export interface Factura {
  id: UUID
  tercero_id: UUID
  tipo: TipoFinanciero
  fecha: ISODate
  created_at: ISOTimestamp
}

export interface FacturaLinea {
  id: UUID
  factura_id: UUID
  venta_linea_id: UUID | null
  total_kg: number | null
  total_importe: number | null
  created_at: ISOTimestamp
}

export interface FacturaLineaDetalle {
  id: UUID
  factura_linea_id: UUID
  peso: number | null
  precio_unitario: number | null
  metadata: Record<string, unknown> | null
  created_at: ISOTimestamp
}

export interface CrearFacturaInput {
  tercero_id: UUID
  tipo: TipoFinanciero
  fecha: ISODate
  lineas: Array<{
    venta_linea_id?: UUID
    total_kg?: number
    total_importe?: number
    detalles?: Array<{
      peso?: number
      precio_unitario?: number
      metadata?: Record<string, unknown>
    }>
  }>
}
