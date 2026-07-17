import { createServerClient } from '../../../../shared/db'
import type { Especie } from '../../../shared/domain/types'

export interface MachoOption {
  id:          string
  nombre:      string | null
  crotal:      string | null
  raza_nombre: string | null
}

// Tipos productivos considerados aptos para cubrición por especie.
// Solo estos machos aparecen en el selector de cubrición natural.
const TIPOS_SEMENTAL: Record<Especie, string[]> = {
  vacuno:  ['Semental'],
  porcino: ['Verraco'],
}

// Devuelve los machos vivos y sementales de la misma especie para el selector de cubrición natural.
export async function getMachosDisponibles(especie: Especie): Promise<MachoOption[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('animal')
    .select('id, nombre, crotal, raza(nombre), tipo_productivo(nombre)')
    .eq('sexo', 'macho')
    .eq('estado_vital', 'vivo')
    .eq('especie', especie)
    .order('crotal', { nullsFirst: false })
  if (error) throw error

  const tiposPermitidos = TIPOS_SEMENTAL[especie] ?? []
  return (data ?? [])
    .filter(row =>
      tiposPermitidos.includes(
        (row.tipo_productivo as { nombre: string } | null)?.nombre ?? '',
      ),
    )
    .map(row => ({
      id:          row.id,
      nombre:      row.nombre,
      crotal:      row.crotal,
      raza_nombre: (row.raza as { nombre: string } | null)?.nombre ?? null,
    }))
}
