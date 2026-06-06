import type { UUID, ISODate, ISOTimestamp } from '../../../shared/types'
import type {
  Especie, Sexo, OrigenAnimal,
  EstadoVital, EstadoReproductivo, EstadoSanitario,
} from '../../shared/domain/types'
import { getAnimalById, getAnimalCrotal } from '../infrastructure/repository'

// Proyección de detalle para la ficha individual del animal.
// Separada de AnimalListItem: cada vista define los campos que necesita.
export interface AnimalDetail {
  id: UUID
  crotal: string | null
  num_hierro: string | null
  especie: Especie
  sexo: Sexo
  tipo: 'normal' | 'reproductor'
  raza_nombre: string | null
  es_reproductora: boolean
  estado_vital: EstadoVital
  estado_reproductivo: EstadoReproductivo | null
  estado_sanitario: EstadoSanitario
  origen: OrigenAnimal
  fecha_nacimiento: ISODate | null
  fecha_nacimiento_estimada: ISODate | null
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
    num_hierro:                animal.num_hierro,
    especie:                   animal.especie,
    sexo:                      animal.sexo,
    tipo:                      animal.tipo,
    raza_nombre:               animal.raza_nombre,
    es_reproductora:           animal.es_reproductora,
    estado_vital:              animal.estado_vital,
    estado_reproductivo:       animal.estado_reproductivo,
    estado_sanitario:          animal.estado_sanitario,
    origen:                    animal.origen,
    fecha_nacimiento:          animal.fecha_nacimiento,
    fecha_nacimiento_estimada: animal.fecha_nacimiento_estimada,
    madre_id:                  animal.madre_id,
    madre_crotal,
    padre_id:                  animal.padre_id,
    padre_crotal,
    lote_id:                   animal.lote_id,
    created_at:                animal.created_at,
  }
}
