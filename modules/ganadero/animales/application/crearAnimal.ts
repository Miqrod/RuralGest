import type { UUID } from '../../../shared/types'
import type { Animal, CrearAnimalInput } from '../domain/types'
import { assertFechaNacimientoPresente, assertEstadoReproductivoCoherente } from '../domain/rules'
import { insertAnimal } from '../infrastructure/repository'

export async function crearAnimal(input: CrearAnimalInput, eventoId: UUID): Promise<Animal> {
  assertFechaNacimientoPresente(input)
  assertEstadoReproductivoCoherente(input.es_reproductora ?? false, null)
  return insertAnimal(input, eventoId)
}
