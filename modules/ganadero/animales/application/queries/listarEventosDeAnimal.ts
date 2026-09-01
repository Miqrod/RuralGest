import type { UUID, ISODate } from '../../../../shared/types'
import { createServerClient } from '../../../../shared/db'

// ─── Tipos del log de eventos ────────────────────────────────────────────────
//
// El log mezcla dos tipos de entradas:
//
//   EventoReal     → evento persistido en la tabla `eventos` (hecho real de la explotación)
//   EventoVirtual  → hito de presentación inyectado en la query layer (nunca persiste)
//
// Los eventos virtuales son ayudas visuales: indican al usuario puntos de inflexión
// en la historia reproductiva (inicio de un nuevo ciclo tras un desenlace).
// Se distinguen del resto mediante `virtual: true` para que la UI pueda renderizarlos
// con un estilo diferenciado (más tenue, sin ID de hash, etc.).
//
// Tipos de evento virtual actuales:
//   'NUEVO_CICLO' → marca el inicio de un ciclo reproductivo tras un desenlace (Parto, Aborto, Machorra)
//
// IMPORTANTE: nunca crear un tipo_evento 'INICIO_CICLO' en la tabla `tipo_evento` de la DB.
// Estos hitos viven exclusivamente en la capa de presentación.

// Evento real de la explotación — datos leídos de la DB.
export interface EventoReal {
  virtual: false
  id: UUID
  fecha: ISODate
  created_at: string     // desempate de ordenación: cuando dos eventos comparten fecha, el más reciente por timestamp va primero
  tipo_codigo: string    // e.g. 'ENTRADA' — clave de máquina
  tipo_label: string     // e.g. 'Entrada' — etiqueta visible (tipo_negocio)
  motivo: string | null  // e.g. 'compra' — null si el tipo no requiere motivo
  rol: string | null     // rol del animal en el evento: 'madre', 'cria', etc. Permite mostrar "Nacimiento" vs "Parto" en PARTO
  ciclo_numero: number | null  // número ordinal del ciclo (C1, C2…) — solo en eventos reproductivos
  // Solo presente en DESTETE cuando rol='madre': las crías que se destetaron en ese evento
  crias_destetadas: { id: UUID; crotal: string | null; nombre: string | null; sexo: string | null }[]
  // Datos extra del evento; cada tipo usa sus propias claves (ej. tipo_nuevo en CAMBIO_TIPO_PRODUCTIVO)
  metadata_json: Record<string, unknown> | null
}

// Evento virtual — hito de presentación, nunca persistido.
// Se inyecta en la query layer para señalizar puntos de inflexión.
export interface EventoVirtual {
  virtual: true
  id: string             // identificador sintético, e.g. 'virtual-ciclo-{ciclo_id}'
  fecha: ISODate
  created_at: string     // ciclo_reproductivo.created_at — el RPC lo inserta DESPUÉS del evento
                         // que lo origina, por lo que su timestamp es naturalmente posterior
  tipo_codigo: 'NUEVO_CICLO'
  ciclo_numero: number   // número del ciclo que comienza (C2, C3…)
}

// Unión discriminada: el campo `virtual` permite al renderizador diferenciar sin castings.
export type EventoEnHistorial = EventoReal | EventoVirtual

// Devuelve todos los eventos del animal (reales + virtuales), del más reciente al más antiguo.
// Los EventoVirtual 'NUEVO_CICLO' se inyectan aquí para C2, C3… y marcan el inicio de cada
// nuevo ciclo en el log de historial. Nunca se persisten en la DB.
export async function listarEventosDeAnimal(animalId: UUID): Promise<EventoEnHistorial[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('evento_animales')
    .select(`
      rol,
      eventos!evento_animales_evento_id_fkey (
        id,
        fecha,
        created_at,
        ciclo_id,
        metadata_json,
        tipo_evento!eventos_tipo_evento_id_fkey ( codigo, tipo_negocio ),
        motivos_movimiento!eventos_motivo_id_fkey ( nombre )
      )
    `)
    .eq('animal_id', animalId)

  if (error) throw error

  const rows = (data ?? []).filter(
    (row): row is typeof row & { eventos: NonNullable<typeof row.eventos> } => row.eventos != null,
  )

  // Un solo query para todos los ciclos del animal:
  //   - mapeo ciclo_id → numero_ciclo para etiquetar eventos reproductivos (C1, C2…)
  //   - generación de EventoVirtual 'NUEVO_CICLO' para ciclos C2, C3… (marca de inicio de ciclo)
  const { data: todosCiclos } = await supabase
    .from('ciclo_reproductivo')
    .select('id, numero_ciclo, fecha_inicio, created_at')
    .eq('animal_id', animalId)

  const cicloNumero: Record<string, number> = {}
  for (const c of todosCiclos ?? []) cicloNumero[c.id] = c.numero_ciclo

  const virtuales: EventoVirtual[] = (todosCiclos ?? [])
    .filter(c => c.numero_ciclo >= 2)
    .map(c => ({
      virtual:      true  as const,
      id:           `virtual-ciclo-${c.id}`,
      fecha:        c.fecha_inicio as ISODate,
      created_at:   c.created_at,
      tipo_codigo:  'NUEVO_CICLO' as const,
      ciclo_numero: c.numero_ciclo,
    }))

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

  const eventosReales: EventoReal[] = rows.map((row): EventoReal => {
    const ev = row.eventos as typeof row.eventos & { ciclo_id?: string | null }
    const cicloId = ev.ciclo_id ?? null
    return {
      virtual:          false,
      id:               ev.id,
      fecha:            ev.fecha as ISODate,
      created_at:       ev.created_at,
      tipo_codigo:      (ev.tipo_evento as { codigo: string; tipo_negocio: string } | null)?.codigo ?? '',
      tipo_label:       (ev.tipo_evento as { codigo: string; tipo_negocio: string } | null)?.tipo_negocio ?? '',
      motivo:           (ev.motivos_movimiento as { nombre: string } | null)?.nombre ?? null,
      rol:              row.rol ?? null,
      ciclo_numero:     cicloId ? (cicloNumero[cicloId] ?? null) : null,
      crias_destetadas: criasPorDestete[ev.id] ?? [],
      metadata_json:    (ev.metadata_json as Record<string, unknown> | null) ?? null,
    }
  })

  // Ordenación descendente: más reciente arriba.
  //
  // Estrategia: todos los eventos (reales y virtuales) tienen ahora `created_at`.
  // El RPC inserta el nuevo ciclo_reproductivo en el mismo transaction DESPUÉS
  // del evento que lo origina, por lo que ciclo.created_at > evento.created_at.
  // Esto garantiza que el virtual "Nuevo ciclo" aparezca por encima del evento
  // causante en el log, sin necesidad de casos especiales.
  //
  // fecha.slice(0, 10): normaliza "YYYY-MM-DD" y "YYYY-MM-DDTHH:MM:SSZ" por
  // si el cliente de Supabase devuelve DATE en formatos distintos según la query.
  return [...eventosReales, ...virtuales].sort((a, b) => {
    const byFecha = b.fecha.slice(0, 10).localeCompare(a.fecha.slice(0, 10))
    if (byFecha !== 0) return byFecha
    return b.created_at.localeCompare(a.created_at)
  })
}
