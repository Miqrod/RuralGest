import { createServerClient } from '../../../../shared/db'
import type { UUID, ISODate } from '../../../../shared/types'
import type { ResultadoCiclo } from '../../../shared/domain/types'
import type { Sexo, EstadoIdentificacion, EstadoVital } from '../../../shared/domain/types'
import type { TipoParto, CodigoEventoReproductivo } from '../../domain/types'

export interface CriaResumen {
  id: UUID
  crotal: string | null
  nombre: string | null
  sexo: Sexo
  estado_identificacion: EstadoIdentificacion | null
  fecha_nacimiento: ISODate | null
  raza_nombre: string | null
  estado_vital: EstadoVital
  padre_crotal: string | null
}

// Resumen mínimo de cría para eventos DESTETE
// fecha_destete: fecha del evento de destete de ESA cría (puede diferir entre crías del mismo ciclo)
export interface CriaDesteteResumen {
  id: UUID
  crotal: string | null
  nombre: string | null
  sexo: Sexo
  fecha_destete: ISODate
}

export interface EventoParto {
  numero_nacidos: number
  numero_vivos: number
  numero_muertos: number
  tipo_parto: TipoParto
  observaciones: string | null
  crias: CriaResumen[]
}

export interface EventoDestete {
  crias: CriaDesteteResumen[]
}

export interface EventoHistorial {
  id: UUID
  fecha: ISODate
  // Código de tipo de evento: normalmente reproductivo, pero puede incluir
  // CAMBIO_TIPO_PRODUCTIVO cuando el animal dejó de ser reproductora durante el ciclo.
  codigo: CodigoEventoReproductivo | string
  // Campos de metadata_json relevantes para visualización
  metadata: Record<string, unknown> | null
  // Solo presente en eventos PARTO
  parto: EventoParto | null
  // Solo presente en eventos DESTETE
  destete: EventoDestete | null
}

export interface CicloHistorial {
  id: UUID
  numero_ciclo: number
  fecha_inicio: ISODate
  fecha_fin: ISODate | null
  resultado: ResultadoCiclo | null
  eventos: EventoHistorial[]  // ordenados cronológicamente (fecha ASC)
}

// Devuelve los ciclos reproductivos del animal con sus eventos y, para partos,
// el listado de crías vivas. Los ciclos vienen ordenados del más reciente al más antiguo.
export async function getHistorialReproductivo(animalId: UUID): Promise<CicloHistorial[]> {
  const supabase = await createServerClient()

  const { data: ciclos, error } = await supabase
    .from('ciclo_reproductivo')
    .select(`
      id, numero_ciclo, fecha_inicio, fecha_fin, resultado,
      eventos (id, fecha, metadata_json, tipo_evento (codigo), evento_parto (*))
    `)
    .eq('animal_id', animalId)
    .order('numero_ciclo', { ascending: false })
  if (error) throw error

  // Recopilar IDs de eventos PARTO y DESTETE para consultas batch
  const partoEventIds: UUID[]                       = []
  const desteteEventIds: UUID[]                     = []
  const desteteEventFecha: Record<string, ISODate>  = {}
  for (const ciclo of ciclos) {
    for (const ev of ciclo.eventos) {
      const codigo = (ev.tipo_evento as { codigo: string } | null)?.codigo
      if (codigo === 'PARTO')   partoEventIds.push(ev.id)
      if (codigo === 'DESTETE') {
        desteteEventIds.push(ev.id)
        desteteEventFecha[ev.id] = ev.fecha as ISODate
      }
    }
  }

  // ── DESTETE: crías destetadas por evento ─────────────────────────────────────
  const criasPorDestete: Record<string, CriaDesteteResumen[]> = {}
  if (desteteEventIds.length > 0) {
    const { data: enlaces, error: enlacesError } = await supabase
      .from('evento_animales')
      .select('evento_id, animal_id')
      .in('evento_id', desteteEventIds)
      .eq('rol', 'cria')
    if (enlacesError) throw enlacesError

    const criaIds = (enlaces ?? []).map(e => e.animal_id).filter(Boolean) as UUID[]
    if (criaIds.length > 0) {
      const { data: crias, error: criasError } = await supabase
        .from('animal')
        .select('id, crotal, nombre, sexo')
        .in('id', criaIds)
      if (criasError) throw criasError

      // fecha_destete se añade al push, no aquí — depende del evento_id del enlace
      const criaById: Record<string, Omit<CriaDesteteResumen, 'fecha_destete'>> = {}
      for (const c of crias ?? []) {
        criaById[c.id] = { id: c.id, crotal: c.crotal, nombre: c.nombre, sexo: c.sexo as Sexo }
      }
      for (const enlace of enlaces ?? []) {
        if (!enlace.animal_id || !enlace.evento_id) continue
        const cria = criaById[enlace.animal_id]
        if (!cria) continue
        criasPorDestete[enlace.evento_id] ??= []
        criasPorDestete[enlace.evento_id].push({
          ...cria,
          fecha_destete: desteteEventFecha[enlace.evento_id],
        })
      }
    }
  }

  // ── PARTO: crías vivas (sin crías muertas: no entran en identificación) ──────
  const criasPorParto: Record<string, CriaResumen[]> = {}
  if (partoEventIds.length > 0) {
    const { data: crias, error: criasError } = await supabase
      .from('animal')
      .select('id, crotal, nombre, sexo, estado_identificacion, parto_evento_id, fecha_nacimiento, estado_vital, padre_id, raza(nombre)')
      .in('parto_evento_id', partoEventIds)
    if (criasError) throw criasError

    // Batch: crotal de todos los padres en una sola query
    const padreIds = [...new Set((crias ?? []).map(c => c.padre_id).filter(Boolean))] as UUID[]
    const padreCrotal: Record<string, string | null> = {}
    if (padreIds.length > 0) {
      const { data: padres } = await supabase
        .from('animal')
        .select('id, crotal')
        .in('id', padreIds)
      for (const p of padres ?? []) padreCrotal[p.id] = p.crotal
    }

    for (const cria of crias ?? []) {
      if (!cria.parto_evento_id) continue
      criasPorParto[cria.parto_evento_id] ??= []
      criasPorParto[cria.parto_evento_id].push({
        id: cria.id,
        crotal: cria.crotal,
        nombre: cria.nombre,
        sexo: cria.sexo as Sexo,
        estado_identificacion: cria.estado_identificacion as EstadoIdentificacion | null,
        fecha_nacimiento: cria.fecha_nacimiento,
        raza_nombre: (cria.raza as { nombre: string } | null)?.nombre ?? null,
        estado_vital: cria.estado_vital as EstadoVital,
        padre_crotal: cria.padre_id ? (padreCrotal[cria.padre_id] ?? null) : null,
      })
    }

    // Orden estable: vivos primero, luego vendidos, luego muertos; dentro de cada grupo por id (UUID inmutable)
    const VITAL_ORDEN: Record<EstadoVital, number> = { vivo: 0, vendido: 1, muerto: 2 }
    for (const key of Object.keys(criasPorParto)) {
      criasPorParto[key].sort((a, b) =>
        VITAL_ORDEN[a.estado_vital] - VITAL_ORDEN[b.estado_vital] || a.id.localeCompare(b.id)
      )
    }
  }

  return ciclos.map(ciclo => ({
    id: ciclo.id,
    numero_ciclo: ciclo.numero_ciclo,
    fecha_inicio: ciclo.fecha_inicio,
    fecha_fin: ciclo.fecha_fin ?? null,
    resultado: ciclo.resultado as ResultadoCiclo | null,
    eventos: ciclo.eventos
      .map(ev => {
        const codigo = (ev.tipo_evento as { codigo: string } | null)?.codigo as CodigoEventoReproductivo | string
        const partoRow = ev.evento_parto as {
          numero_nacidos: number
          numero_vivos: number
          numero_muertos: number
          tipo_parto: string
          observaciones: string | null
        } | null

        return {
          id: ev.id,
          fecha: ev.fecha,
          codigo,
          metadata: ev.metadata_json as Record<string, unknown> | null,
          parto: partoRow
            ? {
                numero_nacidos:  partoRow.numero_nacidos,
                numero_vivos:    partoRow.numero_vivos,
                numero_muertos:  partoRow.numero_muertos,
                tipo_parto:      partoRow.tipo_parto as TipoParto,
                observaciones:   partoRow.observaciones,
                crias:           criasPorParto[ev.id] ?? [],
              }
            : null,
          destete: codigo === 'DESTETE'
            ? { crias: criasPorDestete[ev.id] ?? [] }
            : null,
        }
      })
      // Dentro de cada ciclo, los eventos se muestran cronológicamente
      .sort((a, b) => a.fecha.localeCompare(b.fecha)),
  }))
}
