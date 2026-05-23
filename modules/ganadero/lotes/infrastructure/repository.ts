import type { UUID } from '../../../shared/types'
import type { Lote, CrearLoteInput } from '../domain/types'

export async function getLoteById(_id: UUID): Promise<Lote | null> {
  throw new Error('not implemented')
}

export async function listLotesActivos(_especie?: string): Promise<Lote[]> {
  throw new Error('not implemented')
}

export async function insertLote(_input: CrearLoteInput): Promise<Lote> {
  throw new Error('not implemented')
}

export async function updateCantidadLote(_id: UUID, _delta: number): Promise<void> {
  throw new Error('not implemented')
}
