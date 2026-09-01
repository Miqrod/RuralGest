import { createServerClient } from '../../../shared/db'
import type { DbRow } from '../../../shared/db/helpers'
import type { UUID } from '../../../shared/types'
import type { CicloReproductivo } from '../domain/types'

function mapCicloRow(row: DbRow<'ciclo_reproductivo'>): CicloReproductivo {
  return {
    id:           row.id,
    animal_id:    row.animal_id,
    numero_ciclo: row.numero_ciclo,
    fecha_inicio: row.fecha_inicio,
    fecha_fin:    row.fecha_fin  ?? null,
    resultado:    row.resultado  ?? null,
    created_at:   row.created_at,
    created_by:   row.created_by ?? null,
  }
}

export async function getCicloAbierto(animalId: UUID): Promise<CicloReproductivo | null> {
  const supabase = await createServerClient()
  // ORDER BY numero_ciclo DESC + limit(1): puede haber múltiples ciclos sin fecha_fin
  // (p.ej. un ciclo gestante interrumpido por cambio de tipo + un nuevo ciclo vacía).
  // Siempre devolvemos el más reciente para que la UI opere sobre el ciclo activo correcto.
  const { data, error } = await supabase
    .from('ciclo_reproductivo')
    .select('*')
    .eq('animal_id', animalId)
    .is('fecha_fin', null)
    .is('resultado', null)
    .order('numero_ciclo', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return mapCicloRow(data)
}

// Resuelve el UUID del padre para el ciclo dado, necesario en el momento del parto.
//
// Dos fuentes posibles, consultadas en orden de prioridad:
//
//   1. CUBRICION → metadata_json.macho_id
//      El macho que cubrió físicamente a la hembra. Fuente más fiable porque
//      corresponde a un hecho biológico registrado en el momento en que ocurrió.
//
//   2. CONFIRMACION_GESTACION → metadata_json.padre_id
//      El padre declarado por el ganadero cuando no existe cubrición registrada.
//      Registrado retrospectivamente al confirmar la gestación desde estado vacia.
//      Solo presente cuando el usuario lo informó explícitamente en ese formulario.
//
// Las claves son distintas porque representan contextos distintos:
//   CUBRICION usa "macho_id" (el macho en el acto de cubrición).
//   CONFIRMACION_GESTACION usa "padre_id" (el padre identificado a posteriori).
// Ver decisions.md § "Inferencia del padre en el parto: macho_id vs padre_id".
//
// Devuelve null cuando ninguna de las dos fuentes contiene el dato.
export async function getPadreIdFromCiclo(cicloId: UUID): Promise<UUID | null> {
  const supabase = await createServerClient()

  // Prioridad 1: cubrición natural con macho registrado
  const { data: cubricion, error: errCub } = await supabase
    .from('eventos')
    .select('metadata_json, tipo_evento!inner(codigo)')
    .eq('ciclo_id', cicloId)
    .eq('tipo_evento.codigo', 'CUBRICION')
    .order('fecha', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (errCub) throw errCub
  const machoId = (cubricion?.metadata_json as Record<string, string> | null)?.macho_id ?? null
  if (machoId) return machoId

  // Prioridad 2: padre declarado en confirmación gestación directa (sin cubrición previa)
  const { data: confirmacion, error: errConf } = await supabase
    .from('eventos')
    .select('metadata_json, tipo_evento!inner(codigo)')
    .eq('ciclo_id', cicloId)
    .eq('tipo_evento.codigo', 'CONFIRMACION_GESTACION')
    .order('fecha', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (errConf) throw errConf
  return (confirmacion?.metadata_json as Record<string, string> | null)?.padre_id ?? null
}

// Devuelve la fecha del evento más reciente del ciclo, para limitar el DatePicker en frontend.
// Null si el ciclo todavía no tiene eventos (recién iniciado).
export async function getLastEventoFechaForCiclo(cicloId: UUID): Promise<string | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('eventos')
    .select('fecha')
    .eq('ciclo_id', cicloId)
    .order('fecha', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.fecha ?? null
}
