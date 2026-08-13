import { createServerClient } from '../../../../shared/db'
import type { UUID, ISODate } from '../../../../shared/types'
import type { Sexo } from '../../../shared/domain/types'

export interface CriaParaDesteteItem {
  id: UUID
  crotal: string | null
  nombre: string | null
  sexo: Sexo
  fecha_nacimiento: ISODate | null
  edad_dias: number | null
}

// Devuelve las crías de la madre que aún son elegibles para destete:
//   tipo_productivo = 'Cría' + estado_vital = 'vivo' + estado_vinculo_materno = 'activo'
//
// Las crías ya destetadas (Recría) o muertas no aparecen.
// edad_dias se calcula en cliente para no acoplar la query a funciones de fecha de Postgres.
export async function getCriasParaDestete(madreId: UUID): Promise<CriaParaDesteteItem[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('animal')
    .select('id, crotal, nombre, sexo, fecha_nacimiento, tipo_productivo!inner(nombre)')
    .eq('madre_id', madreId)
    .eq('estado_vital', 'vivo')
    .eq('estado_vinculo_materno', 'activo')
    .eq('tipo_productivo.nombre', 'Cría')
    .order('fecha_nacimiento', { ascending: true })

  if (error) throw error

  const hoy = Date.now()

  return (data ?? []).map(row => ({
    id:               row.id,
    crotal:           row.crotal,
    nombre:           row.nombre,
    sexo:             row.sexo as Sexo,
    fecha_nacimiento: row.fecha_nacimiento,
    edad_dias:        row.fecha_nacimiento
      ? Math.floor((hoy - new Date(row.fecha_nacimiento).getTime()) / 86_400_000)
      : null,
  }))
}
