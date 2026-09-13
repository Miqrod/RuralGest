import { createServerClient } from '../../../shared/db'
import type { UUID } from '../../../shared/types'
import type {
  InstalacionListItem, InstalacionDetalle,
  AnimalEnInstalacion, HistorialUbicacionItem,
  CrearInstalacionInput, ActualizarInstalacionInput,
  ConfigurarUsosInstalacionInput, RegistrarReubicacionAnimalesInput,
  ReubicacionResult, InstalacionDestino, AnimalParaReubicar,
} from '../domain/types'
import {
  mapInstalacionRowToListItem, mapInstalacionRowToDetalle,
  mapAnimalEnInstalacionRow, mapHistorialRow,
  mapCrearInstalacionToInsert, mapActualizarInstalacionToUpdate,
  mapConfigurarUsosToUpdate, mapReubicacionInputToRpcArgs,
  type InstalacionRowWithCount, type AnimalEnInstalacionRow,
  type HistorialRow, type ReubicacionRpcResult,
} from './mapper'

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function fetchInstalaciones(): Promise<InstalacionListItem[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('instalacion')
    .select('*, animal!animal_ubicacion_actual_id_fkey(count)')
    .order('nombre')
  if (error) throw error
  return (data as InstalacionRowWithCount[]).map(mapInstalacionRowToListItem)
}

export async function fetchInstalacionDetalle(id: UUID): Promise<InstalacionDetalle | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('instalacion')
    .select('*, animal!animal_ubicacion_actual_id_fkey(count)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return mapInstalacionRowToDetalle(data as InstalacionRowWithCount)
}

export async function fetchAnimalesEnInstalacion(instalacionId: UUID): Promise<AnimalEnInstalacion[]> {
  const supabase = await createServerClient()

  // 1. Animales vivos asignados a esta instalación
  const { data: animales, error: errAnimales } = await supabase
    .from('animal')
    .select('id, crotal, nombre, especie, sexo, tipo_productivo(nombre)')
    .eq('ubicacion_actual_id', instalacionId)
    .eq('estado_vital', 'vivo')
    .order('crotal')
  if (errAnimales) throw errAnimales
  if (!animales?.length) return []

  const animalIds = animales.map((a) => a.id)

  // 2. Fecha del último CAMBIO_UBICACION hacia esta instalación por animal
  //    Consulta eventos a través de evento_animales para obtener la fecha más reciente.
  const { data: eventos, error: errEventos } = await supabase
    .from('evento_animales')
    .select('animal_id, eventos!inner(fecha, ubicacion_destino_id)')
    .in('animal_id', animalIds)
    .eq('eventos.ubicacion_destino_id', instalacionId)
  if (errEventos) throw errEventos

  // Agrupa por animal_id y toma la fecha más reciente
  const fechaPorAnimal = new Map<string, string>()
  for (const ea of eventos ?? []) {
    const ev = (ea as { animal_id: string; eventos: { fecha: string } }).eventos
    const prev = fechaPorAnimal.get(ea.animal_id)
    if (!prev || ev.fecha > prev) {
      fechaPorAnimal.set(ea.animal_id, ev.fecha)
    }
  }

  return animales.map((a) =>
    mapAnimalEnInstalacionRow(
      a as AnimalEnInstalacionRow,
      fechaPorAnimal.get(a.id) ?? '',
    )
  )
}

export async function fetchHistorialUbicacionesAnimal(animalId: UUID): Promise<HistorialUbicacionItem[]> {
  const supabase = await createServerClient()

  // JOIN: eventos CAMBIO_UBICACION del animal, con nombres de instalación origen y destino
  const { data, error } = await supabase
    .from('evento_animales')
    .select(`
      eventos!inner(
        id,
        fecha,
        metadata_json,
        origen:instalacion!eventos_ubicacion_origen_id_fkey(nombre),
        destino:instalacion!eventos_ubicacion_destino_id_fkey(nombre)
      )
    `)
    .eq('animal_id', animalId)
    .eq('rol', 'self')
    // Filtramos por tipo de evento mediante tipo_evento.codigo — usamos join inner
    .order('fecha', { foreignTable: 'eventos', ascending: false })
  if (error) throw error

  // Extraemos los eventos del join y filtramos los que no tienen ubicación (no son CAMBIO_UBICACION)
  const rows = (data ?? [])
    .map((ea) => (ea as { eventos: HistorialRow }).eventos)
    .filter((ev): ev is HistorialRow =>
      ev !== null && (ev.origen !== null || ev.destino !== null)
    )

  return rows.map(mapHistorialRow)
}

// Todos los animales vivos con su ubicación actual y fecha del último CAMBIO_UBICACION.
// Usa dos queries + agregación en JS para evitar dependencia de una vista o RPC adicional.
export async function fetchAnimalesParaReubicar(): Promise<AnimalParaReubicar[]> {
  const supabase = await createServerClient()

  // 1. Animales vivos con tipo productivo, sexo e instalación actual
  const { data: animales, error: errAnimales } = await supabase
    .from('animal')
    .select('id, crotal, nombre, sexo, ubicacion_actual_id, tipo_productivo(nombre), instalacion:instalacion!animal_ubicacion_actual_id_fkey(nombre)')
    .eq('estado_vital', 'vivo')
    .order('crotal', { nullsFirst: false })
  if (errAnimales) throw errAnimales
  if (!animales?.length) return []

  const animalIds = animales.map((a) => a.id)

  // 2. Eventos con rol='self' para obtener la fecha del último CAMBIO_UBICACION por animal.
  // Los eventos CAMBIO_UBICACION son los únicos que tienen ubicacion_origen_id o
  // ubicacion_destino_id. El resto (VENTA, MUERTE…) dejan esas columnas en NULL.
  const { data: eventosData, error: errEventos } = await supabase
    .from('evento_animales')
    .select('animal_id, eventos!inner(fecha, ubicacion_destino_id, ubicacion_origen_id)')
    .in('animal_id', animalIds)
    .eq('rol', 'self')
  if (errEventos) throw errEventos

  type EventoRow = {
    animal_id: string
    eventos: { fecha: string; ubicacion_destino_id: string | null; ubicacion_origen_id: string | null }
  }

  // MAX(fecha) de CAMBIO_UBICACION por animal.
  // slice(0,10) normaliza tanto DATE ("2026-09-08") como TIMESTAMP ("2026-09-08T00:00:00+00:00").
  const fechaPorAnimal = new Map<string, string>()
  for (const ea of (eventosData ?? []) as EventoRow[]) {
    const ev = ea.eventos
    if (ev.ubicacion_destino_id === null && ev.ubicacion_origen_id === null) continue
    const fechaNorm = ev.fecha.slice(0, 10)
    const prev = fechaPorAnimal.get(ea.animal_id)
    if (!prev || fechaNorm > prev) fechaPorAnimal.set(ea.animal_id, fechaNorm)
  }

  type AnimalRow = {
    id: string
    crotal: string | null
    nombre: string | null
    sexo: string | null
    ubicacion_actual_id: string | null
    tipo_productivo: { nombre: string } | null
    instalacion: { nombre: string } | null
  }

  return (animales as unknown as AnimalRow[]).map((a) => ({
    id:                            a.id,
    crotal:                        a.crotal,
    nombre:                        a.nombre,
    sexo:                          a.sexo as import('../domain/types').AnimalParaReubicar['sexo'],
    tipo_productivo_nombre:        a.tipo_productivo?.nombre ?? null,
    ubicacion_actual_id:           a.ubicacion_actual_id,
    ubicacion_actual_nombre:       a.instalacion?.nombre ?? null,
    fecha_ultimo_cambio_ubicacion: fechaPorAnimal.get(a.id) ?? null,
  }))
}

// Instalaciones elegibles como destino de reubicación: activo + admite_animales.
// Esta proyección es intencional y más estrecha que fetchInstalaciones: no necesita conteo.
export async function fetchDestinosReubicacion(): Promise<InstalacionDestino[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('instalacion')
    .select('id, nombre, tipo')
    .eq('activo', true)
    .eq('admite_animales', true)
    .order('nombre')
  if (error) throw error
  return (data ?? []).map((row) => ({
    id:     row.id,
    nombre: row.nombre,
    tipo:   row.tipo as InstalacionDestino['tipo'],
  }))
}

export async function getInstalacionNombre(id: UUID): Promise<string | null> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('instalacion')
    .select('nombre')
    .eq('id', id)
    .maybeSingle()
  return data?.nombre ?? null
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function insertInstalacion(input: CrearInstalacionInput): Promise<{ id: UUID }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('instalacion')
    .insert(mapCrearInstalacionToInsert(input))
    .select('id')
    .single()
  if (error) throw error
  return { id: data.id }
}

export async function updateInstalacion(input: ActualizarInstalacionInput): Promise<void> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('instalacion')
    .update(mapActualizarInstalacionToUpdate(input))
    .eq('id', input.id)
  if (error) throw error
}

export async function setInstalacionActivo(id: UUID, activo: boolean): Promise<void> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('instalacion')
    .update({ activo })
    .eq('id', id)
  if (error) throw error
}

export async function updateInstalacionUsos(input: ConfigurarUsosInstalacionInput): Promise<void> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('instalacion')
    .update(mapConfigurarUsosToUpdate(input))
    .eq('id', input.id)
  if (error) throw error
}

export async function rpcRegistrarReubicacion(
  input: RegistrarReubicacionAnimalesInput,
): Promise<ReubicacionResult> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.rpc(
    'registrar_reubicacion_animales',
    mapReubicacionInputToRpcArgs(input),
  )
  if (error) throw error
  const result = data as ReubicacionRpcResult
  return {
    procesados:           result.procesados,
    ubicacion_destino_id: result.ubicacion_destino_id,
    fecha:                result.fecha,
  }
}
