import { createServerClient } from '../../../shared/db'
import type { DbRow } from '../../../shared/db/helpers'
import type { UUID } from '../../../shared/types'
import type { CicloReproductivo } from '../domain/types'
import type { ResultadoCiclo } from '../../shared/domain/types'

// Las columnas de ciclo_reproductivo coinciden exactamente con el tipo de dominio.
function mapCicloRow(row: DbRow<'ciclo_reproductivo'>): CicloReproductivo {
  return {
    id:           row.id,
    animal_id:    row.animal_id,
    numero_ciclo: row.numero_ciclo,
    fecha_inicio: row.fecha_inicio,
    fecha_fin:    row.fecha_fin    ?? null,
    resultado:    row.resultado    ?? null,
    created_at:   row.created_at,
    created_by:   row.created_by  ?? null,
  }
}

export async function getCicloAbierto(animalId: UUID): Promise<CicloReproductivo | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('ciclo_reproductivo')
    .select('*')
    .eq('animal_id', animalId)
    .is('fecha_fin', null)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return mapCicloRow(data)
}

// numero_ciclo se calcula aquí: max(numero_ciclo) del animal + 1.
// El caller no debe conocer ni pasar el número de ciclo.
export async function insertCiclo(
  input: Omit<CicloReproductivo, 'id' | 'created_at' | 'numero_ciclo'>,
): Promise<CicloReproductivo> {
  const supabase = await createServerClient()

  const { data: maxData, error: maxError } = await supabase
    .from('ciclo_reproductivo')
    .select('numero_ciclo')
    .eq('animal_id', input.animal_id)
    .order('numero_ciclo', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (maxError) throw maxError

  const numeroCiclo = (maxData?.numero_ciclo ?? 0) + 1

  const { data, error } = await supabase
    .from('ciclo_reproductivo')
    .insert({
      animal_id:    input.animal_id,
      numero_ciclo: numeroCiclo,
      fecha_inicio: input.fecha_inicio,
      fecha_fin:    input.fecha_fin    ?? undefined,
      resultado:    input.resultado    ?? undefined,
      created_by:   input.created_by  ?? undefined,
    })
    .select('*')
    .single()
  if (error) throw error
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

// Cuenta las crías del ciclo que aún tienen vínculo materno activo.
// Usado por el Use Case de destete para decidir si el ciclo debe cerrarse.
//
// Dos pasos porque el cliente de Supabase no soporta subqueries directas:
//   1. Obtener los IDs de eventos del ciclo (normalmente solo hay un PARTO).
//   2. Contar las crías con parto_evento_id en esos IDs y vínculo activo.
export async function getActiveBondsCountForCiclo(cicloId: UUID): Promise<number> {
  const supabase = await createServerClient()

  const { data: eventos, error: errEv } = await supabase
    .from('eventos')
    .select('id')
    .eq('ciclo_id', cicloId)
  if (errEv) throw errEv

  const eventoIds = (eventos ?? []).map(e => e.id)
  if (eventoIds.length === 0) return 0

  const { count, error: errCount } = await supabase
    .from('animal')
    .select('id', { count: 'exact', head: true })
    .in('parto_evento_id', eventoIds)
    .eq('estado_vinculo_materno', 'activo')
    .eq('estado_vital', 'vivo')
  if (errCount) throw errCount

  return count ?? 0
}

// Solo cierra ciclos abiertos (fecha_fin IS NULL).
// Si el ciclo no existe o ya está cerrado, .single() lanza error de Supabase.
export async function updateCicloCierre(
  id: UUID,
  resultado: ResultadoCiclo,
  fechaFin: string,
): Promise<CicloReproductivo> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('ciclo_reproductivo')
    .update({ resultado, fecha_fin: fechaFin })
    .eq('id', id)
    .is('fecha_fin', null)
    .select('*')
    .single()
  if (error) throw error
  return mapCicloRow(data)
}
