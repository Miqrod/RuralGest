import type { UUID, ISODate } from '../../../../shared/types'
import { createServerClient } from '../../../../shared/db'

// Proyección mínima para el log de eventos en la ficha del animal.
// Solo los campos que la UI necesita mostrar — no expone tipos de DB.
export interface EventoDeAnimal {
  id: UUID
  fecha: ISODate
  tipo_codigo: string    // e.g. 'ENTRADA' — clave de máquina
  tipo_label: string     // e.g. 'Entrada' — etiqueta visible (tipo_negocio)
  motivo: string | null  // e.g. 'compra' — null si el tipo no requiere motivo
}

// Devuelve todos los eventos asociados al animal, del más reciente al más antiguo.
// Cada animal tiene al menos uno (el de creación). En el futuro habrá más.
export async function listarEventosDeAnimal(animalId: UUID): Promise<EventoDeAnimal[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('evento_animales')
    .select(`
      eventos!evento_animales_evento_id_fkey (
        id,
        fecha,
        tipo_evento!eventos_tipo_evento_id_fkey ( codigo, tipo_negocio ),
        motivos_movimiento!eventos_motivo_id_fkey ( nombre )
      )
    `)
    .eq('animal_id', animalId)

  if (error) throw error

  // Extraemos el objeto eventos (to-one), filtramos nulos y mapeamos a la proyección.
  // Ordenamos por fecha descendente en JS — la lista será corta en este contexto.
  return (data ?? [])
    .map((row) => row.eventos)
    .filter((e): e is NonNullable<typeof e> => e != null)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map((e) => ({
      id:          e.id,
      fecha:       e.fecha as ISODate,
      tipo_codigo: (e.tipo_evento as { codigo: string; tipo_negocio: string } | null)?.codigo ?? '',
      tipo_label:  (e.tipo_evento as { codigo: string; tipo_negocio: string } | null)?.tipo_negocio ?? '',
      motivo:      (e.motivos_movimiento as { nombre: string } | null)?.nombre ?? null,
    }))
}
