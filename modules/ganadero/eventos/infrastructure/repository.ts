import type { UUID } from '../../../shared/types'
import type { Evento, TipoEvento, MotivoMovimiento } from '../domain/types'

export async function getTipoEventoByCodigo(_codigo: string): Promise<TipoEvento | null> {
  throw new Error('not implemented')
}

export async function getMotivoByNombre(_nombre: string): Promise<MotivoMovimiento | null> {
  throw new Error('not implemented')
}

export async function insertEvento(
  _evento: Omit<Evento, 'id' | 'created_at'>,
): Promise<Evento> {
  throw new Error('not implemented')
}

export async function getEventosByAnimal(_animalId: UUID): Promise<Evento[]> {
  throw new Error('not implemented')
}
