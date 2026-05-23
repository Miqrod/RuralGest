import type { UUID, ISOTimestamp } from '../../../shared/types'
import type { Especie, TipoTecnicoEvento, TipoBaseMovimiento } from '../../shared/domain/types'

export interface TipoEvento {
  id: UUID
  codigo: string
  descripcion: string
  tipo_tecnico: TipoTecnicoEvento
  tipo_negocio: string
  es_biologico: boolean
  requiere_motivo: boolean
  afecta_stock: boolean
  afecta_animales: boolean
  afecta_lotes: boolean
  activo: boolean
}

export interface MotivoMovimiento {
  id: UUID
  nombre: string
  tipo_base: TipoBaseMovimiento
  descripcion: string | null
  es_monetizable: boolean
  tipo_economico: 'ingreso' | 'gasto' | 'ninguno'
  activo: boolean
}

export interface Evento {
  id: UUID
  tipo_evento_id: UUID
  motivo_id: UUID | null
  movimiento_id: UUID | null
  evento_referencia_id: UUID | null
  fecha: ISOTimestamp
  especie: Especie
  ciclo_id: UUID | null
  metadata_json: Record<string, unknown> | null
  created_at: ISOTimestamp
  created_by: UUID | null
}

export interface RegistrarEventoInput {
  tipo_evento_codigo: string
  especie: Especie
  fecha: ISOTimestamp
  motivo_nombre?: string
  animal_ids?: UUID[]
  lote_ids?: UUID[]
  metadata?: Record<string, unknown>
}
