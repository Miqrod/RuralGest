import type { UUID, ISOTimestamp } from '../../../shared/types'
import type { TipoTercero } from '../../shared/domain/types'

export interface Tercero {
  id: UUID
  nombre: string
  tipo: TipoTercero
  activo: boolean
  created_at: ISOTimestamp
}

export interface CrearTerceroInput {
  nombre: string
  tipo: TipoTercero
}
