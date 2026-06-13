import type { UUID } from '../../../../shared/types'
import type { Especie } from '../../../shared/domain/types'
import { createServerClient } from '../../../../shared/db'

// Proyección mínima para poblar un Select de catálogo.
export interface TipoProductivoOption {
  id: UUID
  nombre: string
}

// Devuelve los tipos productivos activos para la especie dada, ordenados alfabéticamente.
// Usada por la página de entrada para pasar opciones al formulario cliente.
export async function listarTiposProductivos(especie: Especie): Promise<TipoProductivoOption[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('tipo_productivo')
    .select('id, nombre')
    .eq('especie', especie)
    .eq('activa', true)
    .order('nombre')
  if (error) throw error
  return data as TipoProductivoOption[]
}
