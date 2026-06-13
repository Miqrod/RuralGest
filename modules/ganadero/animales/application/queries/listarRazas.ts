import type { UUID } from '../../../../shared/types'
import type { Especie } from '../../../shared/domain/types'
import { createServerClient } from '../../../../shared/db'

// Proyección mínima para poblar un Select de catálogo.
export interface RazaOption {
  id: UUID
  nombre: string
}

// Devuelve las razas activas para la especie dada, ordenadas alfabéticamente.
// Usada por la página de entrada para pasar opciones al formulario cliente.
export async function listarRazas(especie: Especie): Promise<RazaOption[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('raza')
    .select('id, nombre')
    .eq('especie', especie)
    .eq('activa', true)
    .order('nombre')
  if (error) throw error
  return data as RazaOption[]
}
