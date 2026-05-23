export function assertStockDisponible(cantidad: number, disponible: number) {
  if (cantidad <= 0) throw new Error('Cantidad inválida')
  if (cantidad > disponible) throw new Error('Stock insuficiente')
}

export function assertLoteActivo(estado: string) {
  if (estado !== 'activo') throw new Error('El lote no está activo')
}
