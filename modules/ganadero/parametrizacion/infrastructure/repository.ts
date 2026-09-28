import { createServerClient } from '../../../shared/db'
import type { Parametrizacion } from '../domain/types'

export async function fetchParametrizaciones(): Promise<Parametrizacion[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('parametrizacion')
    .select('*')
    .order('categoria')
    .order('codigo')
  if (error) throw error
  return data ?? []
}

// Solo actualiza el valor; el backend protege código/tipo/categoría/unidad (no son input).
export async function saveParametrizacion(id: string, valor: string): Promise<void> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('parametrizacion')
    .update({ valor, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
