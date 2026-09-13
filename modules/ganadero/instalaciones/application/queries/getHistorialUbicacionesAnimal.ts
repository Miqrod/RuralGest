import type { UUID } from '../../../../shared/types'
import type { HistorialUbicacionItem } from '../../domain/types'
import { fetchHistorialUbicacionesAnimal } from '../../infrastructure/repository'

export async function getHistorialUbicacionesAnimal(animalId: UUID): Promise<HistorialUbicacionItem[]> {
  return fetchHistorialUbicacionesAnimal(animalId)
}
