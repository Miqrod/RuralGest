import type { CrearVentaInput } from './types'

export function assertVentaTieneLineas(input: CrearVentaInput) {
  if (input.lineas.length === 0) {
    throw new Error('Una venta debe tener al menos una línea')
  }
}

export function assertLineaCoherente(linea: CrearVentaInput['lineas'][number]) {
  if (linea.tipo === 'animal' && !linea.animal_id) {
    throw new Error('Línea de tipo animal requiere animal_id')
  }
  if (linea.tipo === 'lote' && !linea.lote_id) {
    throw new Error('Línea de tipo lote requiere lote_id')
  }
  if (linea.cantidad <= 0) {
    throw new Error('La cantidad de una línea debe ser > 0')
  }
}
