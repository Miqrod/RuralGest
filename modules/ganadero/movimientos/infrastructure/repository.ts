import type { UUID } from '../../../shared/types'
import type { Movimiento, CrearMovimientoInput } from '../domain/types'

export async function insertMovimiento(_input: CrearMovimientoInput): Promise<Movimiento> {
  throw new Error('not implemented')
}

export async function cancelarMovimiento(_id: UUID): Promise<void> {
  throw new Error('not implemented')
}
