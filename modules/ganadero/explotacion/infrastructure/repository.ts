import { createServerClient } from '../../../shared/db'
import type { Explotacion, ActualizarExplotacionInput } from '../domain/types'

export async function fetchExplotacion(): Promise<Explotacion | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('explotacion')
    .select('*')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function saveExplotacion(input: ActualizarExplotacionInput): Promise<void> {
  const supabase = await createServerClient()
  const { id, ...fields } = input
  const { error } = await supabase
    .from('explotacion')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
