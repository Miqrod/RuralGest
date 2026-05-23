import type { UUID, ISODate, ISOTimestamp } from '../../../shared/types'
import type { Especie, TipoLote, EstadoLote, EstadoSanitario } from '../../shared/domain/types'

export interface Lote {
  id: UUID
  especie: Especie
  tipo_lote: TipoLote
  codigo_identificacion: string | null
  lote_origen_id: UUID | null
  fecha_creacion: ISODate
  fecha_cierre: ISODate | null
  cantidad_actual: number
  estado: EstadoLote
  estado_sanitario: EstadoSanitario
  ubicacion_actual_id: UUID | null
  alimentacion: string | null
  created_at: ISOTimestamp
  created_by: UUID | null
  updated_at: ISOTimestamp
  updated_by: UUID | null
}

export interface CrearLoteInput {
  especie: Especie
  tipo_lote: TipoLote
  fecha_creacion: ISODate
  codigo_identificacion?: string
  lote_origen_id?: UUID
}
