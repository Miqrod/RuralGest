
export function assertStockDisponible(
  cantidad: number,
  disponible: number
) {
  if (cantidad > disponible) {
    throw new Error('Stock insuficiente')
  }

  if (cantidad <= 0) {
    throw new Error('Cantidad inválida')
  }
}