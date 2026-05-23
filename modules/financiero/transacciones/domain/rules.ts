import type { CrearTransaccionInput } from './types'

export function assertTransaccionCoherente(input: CrearTransaccionInput) {
  if (input.origen === 'prevision' && !input.venta_id) {
    throw new Error('Transacción de previsión requiere venta_id')
  }
  if (input.origen === 'factura' && !input.factura_id) {
    throw new Error('Transacción de factura requiere factura_id')
  }
  if (input.importe < 0) {
    throw new Error('importe debe ser >= 0; el campo tipo indica la dirección del dinero')
  }
}
