import { createServerClient } from '../../../../shared/db'
import type { UUID, ISODate } from '../../../../shared/types'

// Devuelve el nombre de la instalación donde estaba el animal en la fecha dada.
//
// Lógica de tres casos, resolviendo el historial sólo a partir de eventos:
//   1. Existe un CAMBIO_UBICACION con fecha <= targetDate
//      → la instalación destino del más reciente es la ubicación histórica.
//   2. No existe ningún CAMBIO_UBICACION con fecha <= targetDate pero sí hay
//      eventos posteriores → el animal aún no había sido reubicado; su ubicación
//      era la origen del movimiento más antiguo registrado.
//   3. El animal nunca ha sido reubicado → proyección actual en animal.ubicacion_actual_id.
export async function ubicacionHistoricaEnFecha(
  animalId: UUID,
  targetDate: ISODate,
): Promise<string | null> {
  const supabase = await createServerClient()

  // Arrancamos desde eventos con join interno a evento_animales (filtra por animal)
  // y a tipo_evento (filtra por código CAMBIO_UBICACION).
  const { data, error } = await supabase
    .from('eventos')
    .select(
      `fecha,
       instalacion_destino:instalacion!eventos_ubicacion_destino_id_fkey(nombre),
       instalacion_origen:instalacion!eventos_ubicacion_origen_id_fkey(nombre),
       tipo_evento!inner(codigo),
       evento_animales!inner(animal_id)`,
    )
    .eq('tipo_evento.codigo', 'CAMBIO_UBICACION')
    .eq('evento_animales.animal_id', animalId)
    .order('fecha', { ascending: false })

  if (error) throw error

  type Row = {
    fecha: string
    instalacion_destino: { nombre: string } | null
    instalacion_origen: { nombre: string } | null
  }

  const rows = (data ?? []) as unknown as Row[]

  if (rows.length === 0) {
    // Caso 3: sin reubicaciones → proyección actual del snapshot
    const { data: animal, error: errA } = await supabase
      .from('animal')
      .select('instalacion:instalacion!animal_ubicacion_actual_id_fkey(nombre)')
      .eq('id', animalId)
      .maybeSingle()
    if (errA) throw errA
    const inst = animal?.instalacion as { nombre: string } | null
    return inst?.nombre ?? null
  }

  // Caso 1: el movimiento más reciente cuya fecha <= targetDate
  const anterior = rows.find((r) => r.fecha <= targetDate)
  if (anterior) {
    return anterior.instalacion_destino?.nombre ?? null
  }

  // Caso 2: todos los movimientos son posteriores → origen del más antiguo
  const masAntiguo = rows[rows.length - 1]
  return masAntiguo.instalacion_origen?.nombre ?? null
}
