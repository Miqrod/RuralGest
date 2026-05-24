import type { UUID, ISODate } from '../../../shared/types'
import type { Especie, Sexo, OrigenAnimal, EstadoVital, EstadoReproductivo, EstadoSanitario } from '../../shared/domain/types'
import { listAnimales } from '../infrastructure/repository'

// Proyección para la UI del listado — subconjunto de Animal.
// La UI trabaja con este tipo, nunca con DbRow ni con Animal completo.
export interface AnimalListItem {
  id: UUID
  crotal: string | null
  sexo: Sexo
  especie: Especie
  tipo: 'normal' | 'reproductor'
  origen: OrigenAnimal
  fecha_nacimiento: ISODate | null
  fecha_nacimiento_estimada: ISODate | null
  estado_vital: EstadoVital
  estado_reproductivo: EstadoReproductivo | null
  estado_sanitario: EstadoSanitario
}

export async function listarAnimales(): Promise<AnimalListItem[]> {
  const animales = await listAnimales()
  return animales.map((a) => ({
    id:                        a.id,
    crotal:                    a.crotal,
    sexo:                      a.sexo,
    especie:                   a.especie,
    tipo:                      a.tipo,
    origen:                    a.origen,
    fecha_nacimiento:          a.fecha_nacimiento,
    fecha_nacimiento_estimada: a.fecha_nacimiento_estimada,
    estado_vital:              a.estado_vital,
    estado_reproductivo:       a.estado_reproductivo,
    estado_sanitario:          a.estado_sanitario,
  }))
}
