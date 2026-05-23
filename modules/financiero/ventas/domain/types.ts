import type { UUID, ISODate, ISOTimestamp } from '../../../shared/types'
import type { EstadoVenta } from '../../shared/domain/types'

export interface Venta {
  id: UUID
  cliente_id: UUID
  categoria_id: UUID
  fecha: ISODate
  estado: EstadoVenta
  created_at: ISOTimestamp
}

export interface VentaLinea {
  id: UUID
  venta_id: UUID
  evento_id: UUID
  tipo: 'animal' | 'lote'
  animal_id: UUID | null
  lote_id: UUID | null
  cantidad: number
  created_at: ISOTimestamp
}

export interface CrearVentaInput {
  cliente_id: UUID
  categoria_id: UUID
  fecha: ISODate
  lineas: Array<{
    evento_id: UUID
    tipo: 'animal' | 'lote'
    animal_id?: UUID
    lote_id?: UUID
    cantidad: number
  }>
}
