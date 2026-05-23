import type { UUID } from '../../../shared/types'
import type { Factura, FacturaLinea, CrearFacturaInput } from '../domain/types'

export async function getFacturaById(_id: UUID): Promise<Factura | null> {
  throw new Error('not implemented')
}

export async function insertFactura(_input: CrearFacturaInput): Promise<Factura> {
  throw new Error('not implemented')
}

export async function getLineasByFactura(_facturaId: UUID): Promise<FacturaLinea[]> {
  throw new Error('not implemented')
}
