import type { UUID } from '../../../../shared/types'
import type { Especie, Sexo } from '../../../shared/domain/types'
import { createServerClient } from '../../../../shared/db'
import { sexoRequeridoParaTipo } from '../../domain/rules'

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
// Excluye 'Cría' y 'Recría' (nunca son destino de un cambio manual: las asignan el parto
// y el destete) y los tipos cuyo sexo requerido no coincide con el del animal
// (hembra ≠ Semental/Verraco, macho ≠ Reproductora).
// Con sexo NULL los tipos ligados al sexo SÍ se devuelven: el drawer los bloquea al
// seleccionarlos y explica que hay que identificar el sexo primero.
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

  return (data as TipoProductivoOption[]).filter(t => {
    if (t.nombre === 'Cría' || t.nombre === 'Recría') return false
    const requerido = sexoRequeridoParaTipo(t.nombre)
    return !requerido || sexo === null || requerido === sexo
  })
}
