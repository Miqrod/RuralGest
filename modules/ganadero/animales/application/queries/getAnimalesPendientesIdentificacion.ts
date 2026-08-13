import { createServerClient } from '../../../../shared/db'

export interface AnimalPendienteIdentificacion {
  id: string
  crotal: string | null
  nombre: string | null
  sexo: 'macho' | 'hembra' | null
  fecha_nacimiento: string | null
  madre_id: string | null
  madre_crotal: string | null
  raza_nombre: string | null
}

export async function getAnimalesPendientesIdentificacion(
  especie: 'vacuno' | 'porcino' = 'vacuno',
  limit = 20,
): Promise<{ animales: AnimalPendienteIdentificacion[]; total: number }> {
  const supabase = await createServerClient()

  // Total para mostrar conteo aunque la lista esté recortada
  const { count } = await supabase
    .from('animal')
    .select('*', { count: 'exact', head: true })
    .eq('especie', especie)
    .eq('estado_identificacion', 'pendiente')
    .eq('estado_vital', 'vivo')

  const { data, error } = await supabase
    .from('animal')
    .select('id, crotal, nombre, sexo, fecha_nacimiento, madre_id, madre:madre_id(crotal), raza(nombre)')
    .eq('especie', especie)
    .eq('estado_identificacion', 'pendiente')
    .eq('estado_vital', 'vivo')
    .order('fecha_nacimiento', { ascending: false })
    .limit(limit)

  if (error) throw error

  return {
    total: count ?? 0,
    animales: (data ?? []).map(a => ({
      id: a.id,
      crotal: a.crotal,
      nombre: a.nombre,
      sexo: a.sexo as 'macho' | 'hembra' | null,
      fecha_nacimiento: a.fecha_nacimiento,
      madre_id: a.madre_id ?? null,
      madre_crotal: (a.madre as { crotal: string | null } | null)?.crotal ?? null,
      raza_nombre: (a.raza as { nombre: string } | null)?.nombre ?? null,
    })),
  }
}
