import type { Evento, RegistrarEventoInput } from '../domain/types'
import { assertTipoEventoActivo, assertMotivoRequerido } from '../domain/rules'
import {
  getTipoEventoByCodigo,
  getMotivoByNombre,
  insertEvento,
} from '../infrastructure/repository'

export async function registrarEvento(input: RegistrarEventoInput): Promise<Evento> {
  const tipoEvento = await getTipoEventoByCodigo(input.tipo_evento_codigo)
  if (!tipoEvento) throw new Error(`TipoEvento desconocido: ${input.tipo_evento_codigo}`)
  assertTipoEventoActivo(tipoEvento)

  const motivo = input.motivo_nombre ? await getMotivoByNombre(input.motivo_nombre) : null
  assertMotivoRequerido(tipoEvento, motivo)

  // TODO: crear movimiento si tipo_tecnico === 'STOCK'
  // TODO: insertar evento_animales si animal_ids y afecta_animales
  // TODO: insertar evento_lotes si lote_ids y afecta_lotes
  // TODO: actualizar lote.cantidad_actual si afecta_stock

  return insertEvento({
    tipo_evento_id: tipoEvento.id,
    motivo_id: motivo?.id ?? null,
    movimiento_id: null,
    evento_referencia_id: null,
    fecha: input.fecha,
    especie: input.especie,
    ciclo_id: null,
    metadata_json: input.metadata ?? null,
    created_by: null,
  })
}
