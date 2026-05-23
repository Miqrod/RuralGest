import type { UUID } from '../../../shared/types'
import type { Transaccion, CrearTransaccionInput } from '../domain/types'

export async function insertTransaccion(_input: CrearTransaccionInput): Promise<Transaccion> {
  throw new Error('not implemented')
}

export async function getTransaccionesByVenta(_ventaId: UUID): Promise<Transaccion[]> {
  throw new Error('not implemented')
}

export async function getTransaccionesByFecha(_desde: string, _hasta: string): Promise<Transaccion[]> {
  throw new Error('not implemented')
}
