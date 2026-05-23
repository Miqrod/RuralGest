import type { UUID } from '../../../shared/types'
import type { CicloReproductivo } from '../domain/types'

export async function getCicloAbierto(_animalId: UUID): Promise<CicloReproductivo | null> {
  throw new Error('not implemented')
}

export async function insertCiclo(
  _input: Omit<CicloReproductivo, 'id' | 'created_at'>,
): Promise<CicloReproductivo> {
  throw new Error('not implemented')
}

export async function updateCicloCierre(
  _id: UUID,
  _resultado: string,
  _fechaFin: string,
): Promise<CicloReproductivo> {
  throw new Error('not implemented')
}
