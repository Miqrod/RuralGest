import type { UUID, ISOTimestamp } from '../../../shared/types'
import type { MovimientoEstado } from '../../shared/domain/types'

export interface Movimiento {
  id: UUID
  tipo_movimiento: string
  fecha: ISOTimestamp
  descripcion: string | null
  usuario_id: UUID | null
  estado: MovimientoEstado
  created_at: ISOTimestamp
  created_by: UUID | null
}

export interface CrearMovimientoInput {
  tipo_movimiento: string
  fecha: ISOTimestamp
  descripcion?: string
  usuario_id?: UUID
}
