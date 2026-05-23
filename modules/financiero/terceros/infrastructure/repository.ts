import type { UUID } from '../../../shared/types'
import type { Tercero, CrearTerceroInput } from '../domain/types'

export async function getTerceroById(_id: UUID): Promise<Tercero | null> {
  throw new Error('not implemented')
}

export async function listTerceros(): Promise<Tercero[]> {
  throw new Error('not implemented')
}

export async function insertTercero(_input: CrearTerceroInput): Promise<Tercero> {
  throw new Error('not implemented')
}
