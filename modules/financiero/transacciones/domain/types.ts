import type { UUID, ISODate, ISOTimestamp } from '../../../shared/types'
import type { TipoFinanciero, OrigenTransaccion } from '../../shared/domain/types'

export interface Transaccion {
  id: UUID
  tipo: TipoFinanciero
  origen: OrigenTransaccion
  venta_id: UUID | null
  factura_id: UUID | null
  tercero_id: UUID
  categoria_id: UUID
  importe: number
  fecha: ISODate
  descripcion: string
  created_at: ISOTimestamp
}

export interface CrearTransaccionInput {
  tipo: TipoFinanciero
  origen: OrigenTransaccion
  tercero_id: UUID
  categoria_id: UUID
  importe: number
  fecha: ISODate
  descripcion: string
  venta_id?: UUID
  factura_id?: UUID
}
