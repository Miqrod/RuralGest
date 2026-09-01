import { createServerClient } from '../../../../shared/db'
import type { UUID, ISODate } from '../../../../shared/types'

// Datos del ciclo abierto necesarios para renderizar la ficha del animal.
// Combina getCicloAbierto + getLastEventoFechaForCiclo en una sola query
// para evitar la segunda consulta serial que tenía page.tsx.
export interface CicloAbiertoParaFicha {
  id: UUID
  numero_ciclo: number
  fecha_inicio: ISODate
  // Fecha del evento más reciente del ciclo, o fecha_inicio si aún no hay eventos.
  // Usada como límite inferior del DatePicker en los formularios de acciones.
  fechaUltimoEvento: ISODate
}

export async function getCicloAbiertoParaFicha(
  animalId: UUID,
): Promise<CicloAbiertoParaFicha | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('ciclo_reproductivo')
    .select('id, numero_ciclo, fecha_inicio, eventos(fecha)')
    .eq('animal_id', animalId)
    .is('fecha_fin', null)
    .is('resultado', null)
    .order('numero_ciclo', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const eventos = (data.eventos as { fecha: string }[] | null) ?? []
  const fechaUltimoEvento: ISODate =
    eventos.length > 0
      ? (eventos.sort((a, b) => b.fecha.localeCompare(a.fecha))[0].fecha as ISODate)
      : (data.fecha_inicio as ISODate)

  return {
    id:               data.id,
    numero_ciclo:     data.numero_ciclo,
    fecha_inicio:     data.fecha_inicio as ISODate,
    fechaUltimoEvento,
  }
}
