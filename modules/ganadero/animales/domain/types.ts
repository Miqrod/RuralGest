import type { UUID, ISODate, ISOTimestamp } from '../../../shared/types'
import type {
  Especie, Sexo, OrigenAnimal,
  EstadoVital, EstadoReproductivo, EstadoSanitario,
} from '../../shared/domain/types'

export interface Animal {
  id: UUID
  especie: Especie
  tipo_productivo_id: UUID | null
  tipo_productivo_nombre: string | null
  crotal: string | null
  num_hierro: string | null
  raza_id: UUID | null
  raza_nombre: string | null
  fecha_nacimiento: ISODate | null
  fecha_nacimiento_estimada: ISODate | null
  sexo: Sexo
  madre_id: UUID | null
  padre_id: UUID | null
  es_reproductora: boolean
  origen: OrigenAnimal
  lote_id: UUID | null
  lote_origen_id: UUID | null
  evento_creacion_id: UUID | null
  evento_origen_id: UUID | null
  estado_vital: EstadoVital
  estado_reproductivo: EstadoReproductivo | null
  estado_sanitario: EstadoSanitario
  ubicacion_actual_id: UUID | null
  created_at: ISOTimestamp
  created_by: UUID | null
  updated_at: ISOTimestamp
  updated_by: UUID | null
}

export interface CrearAnimalInput {
  especie: Especie
  tipo_productivo_id?: UUID
  sexo: Sexo
  origen: OrigenAnimal
  fecha_nacimiento?: ISODate
  fecha_nacimiento_estimada?: ISODate
  crotal?: string
  num_hierro?: string
  raza_id?: UUID
  madre_id?: UUID
  padre_id?: UUID
  lote_id?: UUID
}

export interface RegistrarCompraAnimalInput {
  // Identidad del animal
  especie: Especie
  sexo: Sexo
  tipo_productivo_id: UUID
  crotal?: string
  num_hierro?: string
  raza_id?: UUID
  fecha_nacimiento?: ISODate
  fecha_nacimiento_estimada?: ISODate
  // Datos de la compra
  fecha_compra: ISODate
  // Asignación inicial (opcional)
  lote_id?: UUID
}

// Salida por venta: sin datos financieros (precio, comprador) — se añadirán en fase financiera.
export interface RegistrarVentaAnimalInput {
  animal_id: UUID
  fecha_venta: ISODate
}

// Salida por muerte: sin causa ni clasificación sanitaria — se añadirán en fases futuras.
export interface RegistrarMuerteAnimalInput {
  animal_id: UUID
  fecha_muerte: ISODate
}
