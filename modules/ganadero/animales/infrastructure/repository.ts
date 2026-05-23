import type { UUID } from '../../../shared/types'
import type { Animal, CrearAnimalInput } from '../domain/types'

export async function getAnimalById(_id: UUID): Promise<Animal | null> {
  throw new Error('not implemented')
}

export async function listAnimalesByLote(_loteId: UUID): Promise<Animal[]> {
  throw new Error('not implemented')
}

export async function insertAnimal(_input: CrearAnimalInput, _eventoId: UUID): Promise<Animal> {
  throw new Error('not implemented')
}
