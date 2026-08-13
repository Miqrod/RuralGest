import type { UUID, ISODate } from '../../../../shared/types'
import { createServerClient } from '../../../../shared/db'

// Proyección mínima para el log de eventos en la ficha del animal.
// Solo los campos que la UI necesita mostrar — no expone tipos de DB.
export interface EventoDeAnimal {
  id: UUID
  fecha: ISODate
  created_at: string     // desempate de ordenación: cuando dos eventos comparten fecha, el más reciente por timestamp va primero
  tipo_codigo: string    // e.g. 'ENTRADA' — clave de máquina
  tipo_label: string     // e.g. 'Entrada' — etiqueta visible (tipo_negocio)
  motivo: string | null  // e.g. 'compra' — null si el tipo no requiere motivo
  rol: string | null     // rol del animal en el evento: 'madre', 'cria', etc. Permite mostrar "Nacimiento" vs "Parto" en PARTO.
  // Solo presente en DESTETE cuando rol='madre': las crías que se destetaron en ese evento
  crias_destetadas: { id: UUID; crotal: string | null; nombre: string | null; sexo: string | null }[]
}

// Devuelve todos los eventos asociados al animal, del más reciente al más antiguo.
// Cada animal tiene al menos uno (el de creación). En el futuro habrá más.
export async function listarEventosDeAnimal(animalId: UUID): Promise<EventoDeAnimal[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('evento_animales')
    .select(`
      rol,
      eventos!evento_animales_evento_id_fkey (
        id,
        fecha,
        created_at,
        tipo_evento!eventos_tipo_evento_id_fkey ( codigo, tipo_negocio ),
        motivos_movimiento!eventos_motivo_id_fkey ( nombre )
      )
    `)
    .eq('animal_id', animalId)

  if (error) throw error

  const rows = (data ?? []).filter(
    (row): row is typeof row & { eventos: NonNullable<typeof row.eventos> } => row.eventos != null,
  )

  // Para DESTETE donde este animal es la madre: obtener crías destetadas en batch
  const desteteEventIdsMadre = rows
    .filter(r => {
      const codigo = (r.eventos.tipo_evento as { codigo: string } | null)?.codigo
      return codigo === 'DESTETE' && r.rol === 'madre'
    })
    .map(r => r.eventos.id)

  const criasPorDestete: Record<string, { id: UUID; crotal: string | null; nombre: string | null; sexo: string | null }[]> = {}
  if (desteteEventIdsMadre.length > 0) {
    const { data: enlaces } = await supabase
      .from('evento_animales')
      .select('evento_id, animal_id')
      .in('evento_id', desteteEventIdsMadre)
      .eq('rol', 'cria')

    const criaIds = (enlaces ?? []).map(e => e.animal_id).filter(Boolean) as UUID[]
    if (criaIds.length > 0) {
      const { data: crias } = await supabase
        .from('animal')
        .select('id, crotal, nombre, sexo')
        .in('id', criaIds)

      const criaById: Record<string, { id: UUID; crotal: string | null; nombre: string | null; sexo: string | null }> = {}
      for (const c of crias ?? []) criaById[c.id] = { id: c.id, crotal: c.crotal, nombre: c.nombre, sexo: c.sexo }

      for (const enlace of enlaces ?? []) {
        if (!enlace.animal_id || !enlace.evento_id) continue
        const cria = criaById[enlace.animal_id]
        if (!cria) continue
        criasPorDestete[enlace.evento_id] ??= []
        criasPorDestete[enlace.evento_id].push(cria)
      }
    }
  }

  // Ordenamos por fecha descendente en JS — la lista será corta en este contexto.
  return rows
    .sort((a, b) => {
      const byFecha = b.eventos.fecha.localeCompare(a.eventos.fecha)
      if (byFecha !== 0) return byFecha
      return b.eventos.created_at.localeCompare(a.eventos.created_at)
    })
    .map((row) => ({
      id:               row.eventos.id,
      fecha:            row.eventos.fecha as ISODate,
      created_at:       row.eventos.created_at,
      tipo_codigo:      (row.eventos.tipo_evento as { codigo: string; tipo_negocio: string } | null)?.codigo ?? '',
      tipo_label:       (row.eventos.tipo_evento as { codigo: string; tipo_negocio: string } | null)?.tipo_negocio ?? '',
      motivo:           (row.eventos.motivos_movimiento as { nombre: string } | null)?.nombre ?? null,
      rol:              row.rol ?? null,
      crias_destetadas: criasPorDestete[row.eventos.id] ?? [],
    }))
}
