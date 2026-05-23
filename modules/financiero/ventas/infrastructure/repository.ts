import type { UUID } from '../../../shared/types'
import type { Venta, VentaLinea, CrearVentaInput } from '../domain/types'

export async function getVentaById(_id: UUID): Promise<Venta | null> {
  throw new Error('not implemented')
}

export async function insertVenta(_input: CrearVentaInput): Promise<Venta> {
  throw new Error('not implemented')
}

export async function getLineasByVenta(_ventaId: UUID): Promise<VentaLinea[]> {
  throw new Error('not implemented')
}

export async function updateEstadoVenta(_id: UUID, _estado: string): Promise<void> {
  throw new Error('not implemented')
}
