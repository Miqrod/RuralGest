import { createServerClient } from '../../../../shared/db'
import type { AnimalParaReubicar } from '../../domain/types'

// Devuelve animales vivos sin instalación asignada (ubicacion_actual_id IS NULL).
// Se usa en el widget de dashboard para mostrar pendientes de ubicar.
export async function getAnimalesSinUbicacion(): Promise<{
  animales: AnimalParaReubicar[]
  total: number
}> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('animal')
    .select('id, crotal, nombre, sexo, tipo_productivo(nombre)')
    .eq('estado_vital', 'vivo')
    .is('ubicacion_actual_id', null)
    .order('crotal', { ascending: true, nullsFirst: false })

  if (error) throw error

  const animales: AnimalParaReubicar[] = (data ?? []).map((row) => ({
    id:                            row.id,
    crotal:                        row.crotal,
    nombre:                        row.nombre,
    sexo:                          row.sexo as AnimalParaReubicar['sexo'],
    tipo_productivo_nombre:        (row.tipo_productivo as { nombre: string } | null)?.nombre ?? null,
    fecha_ultimo_cambio_ubicacion: null,
    ubicacion_actual_id:           null,
    ubicacion_actual_nombre:       null,
  }))

  return { animales, total: animales.length }
}
