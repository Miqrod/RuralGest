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
