import { differenceInCalendarDays, parse } from 'date-fns'
import { createServerClient } from '../../../../shared/db'
import type { Especie } from '../../../shared/domain/types'
import type { SeguimientoCrias, CriaEnSeguimiento } from '../../domain/analytics'

function isoToDate(iso: string): Date {
  return parse(iso, 'yyyy-MM-dd', new Date())
}

// Devuelve las crías vivas con vínculo materno activo, ordenadas por días desde
// nacimiento descendente (las más recientes al final, las más antiguas primero).
export async function getOffspringFollowUp(especie: Especie): Promise<SeguimientoCrias> {
  const supabase = await createServerClient()

  // PostgREST no resuelve el auto-join animal→animal en el schema cache.
  // Hacemos dos queries y unimos en JS.
  const { data, error } = await supabase
    .from('animal')
    .select(
      `id,
       crotal,
       nombre,
       fecha_nacimiento,
       madre_id,
       instalacion:instalacion!animal_ubicacion_actual_id_fkey(nombre),
       tipo_productivo:tipo_productivo!animal_tipo_productivo_id_fkey(nombre)`,
    )
    .eq('especie', especie)
    .eq('estado_vital', 'vivo')
    .eq('estado_vinculo_materno', 'activo')
    .not('madre_id', 'is', null)
    .not('fecha_nacimiento', 'is', null)
    .order('fecha_nacimiento', { ascending: true })

  if (error) throw error

  const rows = data ?? []

  // Fetch madres en una sola query usando los IDs únicos
  const madreIds = [...new Set(rows.map((r) => r.madre_id!))]
  const madreMap = new Map<string, { crotal: string | null; nombre: string | null }>()

  if (madreIds.length > 0) {
    const { data: madres, error: errMadres } = await supabase
      .from('animal')
      .select('id, crotal, nombre')
      .in('id', madreIds)
    if (errMadres) throw errMadres
    for (const m of madres ?? []) {
      madreMap.set(m.id, { crotal: m.crotal, nombre: m.nombre })
    }
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const crias: CriaEnSeguimiento[] = rows.map((row) => {
    const instRaw = row.instalacion as unknown
    const instalacion = (Array.isArray(instRaw) ? instRaw[0] : instRaw) as { nombre: string } | null
    const tpRaw = row.tipo_productivo as unknown
    const tipoProductivo = (Array.isArray(tpRaw) ? tpRaw[0] : tpRaw) as { nombre: string } | null
    const madre = madreMap.get(row.madre_id!) ?? null

    return {
      id: row.id,
      crotal: row.crotal,
      nombre: row.nombre,
      madreId: row.madre_id!,
      madreCrotal: madre?.crotal ?? null,
      madreNombre: madre?.nombre ?? null,
      fechaNacimiento: row.fecha_nacimiento!,
      diasDesdeNacimiento: differenceInCalendarDays(hoy, isoToDate(row.fecha_nacimiento!)),
      tipoProductivo: tipoProductivo?.nombre ?? null,
      ubicacionNombre: instalacion?.nombre ?? null,
    }
  })

  return { total: crias.length, crias }
}
