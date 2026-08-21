import type { UUID } from '../../../../shared/types'
import type { Especie, Sexo } from '../../../shared/domain/types'
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

// Devuelve los tipos productivos disponibles como destino de un cambio de tipo.
// Excluye 'Cría' (nunca es destino válido de un cambio manual) y aplica
// restricciones de sexo: hembras no pueden ser Semental, machos no pueden ser Reproductora.
// Se filtra en memoria: tipo_productivo es un catálogo pequeño (~5 filas).
export async function getTiposProductivosDisponibles(
  especie: Especie,
  sexo: Sexo,
): Promise<TipoProductivoOption[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('tipo_productivo')
    .select('id, nombre')
    .eq('especie', especie)
    .eq('activa', true)
    .order('nombre')
  if (error) throw error

  const excluidos = new Set<string>(['Cría'])
  if (sexo === 'hembra') excluidos.add('Semental')
  if (sexo === 'macho')  excluidos.add('Reproductora')

  return (data as TipoProductivoOption[]).filter(t => !excluidos.has(t.nombre))
}
