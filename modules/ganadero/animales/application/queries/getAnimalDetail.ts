import type { UUID, ISODate, ISOTimestamp } from '../../../../shared/types'
import type {
  Especie, Sexo, OrigenAnimal,
  EstadoVital, EstadoReproductivo, EstadoSanitario, EstadoIdentificacion, EstadoVinculoMaterno,
} from '../../../shared/domain/types'
import { getAnimalById, getAnimalCrotal } from '../../infrastructure/repository'

// Proyección de detalle para la ficha individual del animal.
// Separada de AnimalListItem: cada vista define los campos que necesita.
export interface AnimalDetail {
  id: UUID
  crotal: string | null
  nombre: string | null
  num_hierro: string | null
  especie: Especie
  sexo: Sexo
  tipo_productivo_nombre: string | null
  raza_nombre: string | null
  es_reproductora: boolean
  estado_vital: EstadoVital
  estado_reproductivo: EstadoReproductivo | null
  fecha_prevista_parto: ISODate | null
  estado_sanitario: EstadoSanitario
  origen: OrigenAnimal
  fecha_nacimiento: ISODate | null
  fecha_nacimiento_estimada: ISODate | null
  estado_identificacion: EstadoIdentificacion | null
  estado_vinculo_materno: EstadoVinculoMaterno | null
  madre_id: UUID | null
  madre_crotal: string | null
  padre_id: UUID | null
  padre_crotal: string | null
  lote_id: UUID | null
  created_at: ISOTimestamp
}

export async function getAnimalDetail(id: UUID): Promise<AnimalDetail | null> {
  const animal = await getAnimalById(id)
  if (!animal) return null

  // Resolvemos los crotales de madre y padre en paralelo para no encadenar esperas.
  const [madre_crotal, padre_crotal] = await Promise.all([
    animal.madre_id ? getAnimalCrotal(animal.madre_id) : Promise.resolve(null),
    animal.padre_id ? getAnimalCrotal(animal.padre_id) : Promise.resolve(null),
  ])

  return {
    id:                        animal.id,
    crotal:                    animal.crotal,
    nombre:                    animal.nombre,
    num_hierro:                animal.num_hierro,
    especie:                   animal.especie,
    sexo:                      animal.sexo,
    tipo_productivo_nombre:    animal.tipo_productivo_nombre,
    raza_nombre:               animal.raza_nombre,
    es_reproductora:           animal.es_reproductora,
    estado_vital:              animal.estado_vital,
    estado_reproductivo:       animal.estado_reproductivo,
    fecha_prevista_parto:      animal.fecha_prevista_parto,
    estado_sanitario:          animal.estado_sanitario,
    origen:                    animal.origen,
    fecha_nacimiento:          animal.fecha_nacimiento,
    fecha_nacimiento_estimada: animal.fecha_nacimiento_estimada,
    estado_identificacion:     animal.estado_identificacion,
    estado_vinculo_materno:    animal.estado_vinculo_materno,
    madre_id:                  animal.madre_id,
    madre_crotal,
    padre_id:                  animal.padre_id,
    padre_crotal,
    lote_id:                   animal.lote_id,
    created_at:                animal.created_at,
  }
}
