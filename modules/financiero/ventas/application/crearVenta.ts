import type { Venta, CrearVentaInput } from '../domain/types'
import { assertVentaTieneLineas, assertLineaCoherente } from '../domain/rules'
import { insertVenta } from '../infrastructure/repository'

export async function crearVenta(input: CrearVentaInput): Promise<Venta> {
  assertVentaTieneLineas(input)
  input.lineas.forEach(assertLineaCoherente)

  // TODO: verificar que cliente_id existe y tipo es 'cliente' o 'mixto'
  // TODO: verificar que categoria_id es tipo 'ingreso'
  // TODO: verificar que cada evento_id corresponde a un evento SALIDA

  return insertVenta(input)
}
