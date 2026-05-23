import type { Lote, CrearLoteInput } from '../domain/types'
import { insertLote } from '../infrastructure/repository'

export async function crearLote(input: CrearLoteInput): Promise<Lote> {
  // TODO: crear evento CREACION_LOTE asociado
  return insertLote(input)
}
