import { getAnimalById } from '../../infrastructure/repository'
import { buildIdentificationStatus } from '../../domain/IdentificationRules'
import type { AnimalIdentificationStatus } from '../../domain/IdentificationRules'
import type { UUID } from '../../../../shared/types'

// Evalúa el estado de identificación de un animal aplicando las reglas del dominio.
// Solo aplica a crías nacidas de un parto registrado en el sistema
// (estado_identificacion !== null). Para el resto devuelve null.
//
// buildIdentificationStatus es la fuente autoritativa — no confiar únicamente
// en el campo estado_identificacion de la BD, que es un snapshot que puede
// quedar desincronizado si los datos del animal se actualizan directamente.
export async function getAnimalIdentificationStatus(
  animalId: UUID,
): Promise<AnimalIdentificationStatus | null> {
  const animal = await getAnimalById(animalId)
  if (!animal) throw new Error(`Animal no encontrado: ${animalId}`)

  if (animal.estado_identificacion === null) return null

  return buildIdentificationStatus(animal)
}
