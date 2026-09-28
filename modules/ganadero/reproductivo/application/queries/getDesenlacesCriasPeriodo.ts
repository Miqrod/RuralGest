import { createServerClient } from '../../../../shared/db'
import type { Especie } from '../../../shared/domain/types'
import type {
  PeriodoAnalisis,
  DesenlacesCriasPeriodo,
  DesenlaceCria,
  ConteoDesenlace,
} from '../../domain/analytics'

// Orden canónico para los desenlaces en la UI
const ORDEN_DESENLACES: DesenlaceCria[] = [
  'destete_natural',
  'destete_forzado',
  'aun_lactante',
  'vendida_antes_destete',
  'muerte_antes_destete',
]

// Clasifica una cría finalizada según el metadata_json de su evento DESTETE.
// - Sin evento DESTETE → nacida muerta (excluida de nacidas vivas)
// - metadata null o sin campo especial → destete explícito por el ganadero
// - cierre_por_salida → la madre se fue (muerte o venta)
// - cierre_por_cria='muerte' → la cría murió con vínculo activo
// - cierre_por_cria='venta' → la cría fue vendida con vínculo activo
export function clasificarFinalizada(
  meta: Record<string, unknown> | null | undefined,
): DesenlaceCria | 'nacida_muerta' {
  if (meta === undefined) return 'nacida_muerta'
  const m = meta ?? {}
  if (m['cierre_por_salida'])            return 'destete_forzado'
  if (m['cierre_por_cria'] === 'muerte') return 'muerte_antes_destete'
  if (m['cierre_por_cria'] === 'venta')  return 'vendida_antes_destete'
  return 'destete_natural'
}

export async function getDesenlacesCriasPeriodo(
  especie: Especie,
  periodo: PeriodoAnalisis,
): Promise<DesenlacesCriasPeriodo> {
  const supabase = await createServerClient()

  // ── Paso 1: crías nacidas en el periodo con madre registrada ─────────────────
  const { data: crias, error: criasError } = await supabase
    .from('animal')
    .select('id, estado_vital, estado_vinculo_materno')
    .eq('especie', especie)
    .not('madre_id', 'is', null)
    .gte('fecha_nacimiento', periodo.desde)
    .lte('fecha_nacimiento', periodo.hasta)

  if (criasError) throw criasError

  const allCrias = crias ?? []
  if (allCrias.length === 0) {
    return {
      periodo,
      nacidasVivas:   0,
      nacidasMuertas: 0,
      desenlaces: ORDEN_DESENLACES.map(d => ({ desenlace: d, total: 0, porcentaje: 0 })),
    }
  }

  // ── Paso 2: eventos DESTETE para crías con vínculo finalizado ────────────────
  // Las nacidas muertas nunca tuvieron vínculo activo → no tienen evento DESTETE.
  // Cualquier otra finalización (natural, forzada, muerte, venta) sí lo tiene.
  const finalizadasIds = allCrias
    .filter(c => c.estado_vinculo_materno === 'finalizado')
    .map(c => c.id)

  // animal_id → metadata_json del evento DESTETE (undefined = sin evento = nacida muerta)
  const destetoMap = new Map<string, Record<string, unknown> | null>()

  if (finalizadasIds.length > 0) {
    const { data: rows, error: desteteError } = await supabase
      .from('evento_animales')
      .select('animal_id, eventos(metadata_json, tipo_evento(codigo))')
      .in('animal_id', finalizadasIds)

    if (desteteError) throw desteteError

    for (const row of rows ?? []) {
      const evento = Array.isArray(row.eventos) ? row.eventos[0] : row.eventos
      if (!evento) continue
      const tipo = Array.isArray(evento.tipo_evento) ? evento.tipo_evento[0] : evento.tipo_evento
      if ((tipo as { codigo?: string } | null)?.codigo !== 'DESTETE') continue
      // Solo el primer DESTETE encontrado por animal
      if (!destetoMap.has(row.animal_id)) {
        destetoMap.set(row.animal_id, evento.metadata_json as Record<string, unknown> | null)
      }
    }
  }

  // ── Paso 3: clasificar cada cría ─────────────────────────────────────────────
  const counts: Record<DesenlaceCria, number> = {
    destete_natural:       0,
    destete_forzado:       0,
    vendida_antes_destete: 0,
    muerte_antes_destete:  0,
    aun_lactante:          0,
  }
  let nacidasMuertas = 0

  for (const c of allCrias) {
    const vinculo = c.estado_vinculo_materno

    if (vinculo === 'activo' || vinculo === null) {
      // null: el backfill puede no haber alcanzado este registro, se trata como activo
      counts.aun_lactante++
      continue
    }

    // vinculo === 'finalizado'
    const meta = destetoMap.has(c.id) ? destetoMap.get(c.id) : undefined
    const desenlace = clasificarFinalizada(meta)

    if (desenlace === 'nacida_muerta') {
      nacidasMuertas++
    } else {
      counts[desenlace]++
    }
  }

  const nacidasVivas = allCrias.length - nacidasMuertas

  const desenlaces: ConteoDesenlace[] = ORDEN_DESENLACES.map(d => ({
    desenlace:  d,
    total:      counts[d],
    porcentaje: nacidasVivas > 0
      ? Math.round((counts[d] / nacidasVivas) * 1000) / 10
      : 0,
  }))

  return { periodo, nacidasVivas, nacidasMuertas, desenlaces }
}
