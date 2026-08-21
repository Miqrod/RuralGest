import { createServerClient } from '../../../../shared/db'
import type { UUID } from '../../../../shared/types'
import type { Sexo, EstadoIdentificacion, EstadoVital } from '../../../shared/domain/types'
import type { CriaResumen } from './getHistorialReproductivo'

// Devuelve las crías con vínculo materno activo — independiente del ciclo reproductivo.
// Se usa para el widget "Crías con vínculo activo" en la ficha de la madre.
//
// Diferencia con getCriasParaDestete: no filtra por tipo_productivo='Cría' ni por
// es_reproductora — aquí interesa cualquier cría con vínculo activo, aunque la madre
// haya cambiado de tipo productivo.
export async function getCriasConVinculoActivo(madreId: UUID): Promise<CriaResumen[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('animal')
    .select('id, crotal, nombre, sexo, estado_identificacion, fecha_nacimiento, estado_vital, padre_id, raza(nombre)')
    .eq('madre_id', madreId)
    .eq('estado_vinculo_materno', 'activo')
    .eq('estado_vital', 'vivo')
    .order('fecha_nacimiento', { ascending: true })

  if (error) throw error

  const padreIds = (data ?? []).map(r => r.padre_id).filter(Boolean) as UUID[]
  const padreCrotal: Record<string, string | null> = {}
  if (padreIds.length > 0) {
    const { data: padres } = await supabase
      .from('animal')
      .select('id, crotal')
      .in('id', padreIds)
    for (const p of padres ?? []) padreCrotal[p.id] = p.crotal
  }

  return (data ?? []).map(row => ({
    id:                    row.id,
    crotal:                row.crotal,
    nombre:                row.nombre,
    sexo:                  row.sexo as Sexo,
    estado_identificacion: row.estado_identificacion as EstadoIdentificacion | null,
    fecha_nacimiento:      row.fecha_nacimiento,
    raza_nombre:           (row.raza as { nombre: string } | null)?.nombre ?? null,
    estado_vital:          row.estado_vital as EstadoVital,
    padre_crotal:          row.padre_id ? (padreCrotal[row.padre_id] ?? null) : null,
  }))
}
