import type {
  Instalacion, InstalacionListItem, InstalacionDetalle,
  AnimalEnInstalacion, HistorialUbicacionItem,
  CrearInstalacionInput, ActualizarInstalacionInput, ConfigurarUsosInstalacionInput,
  RegistrarReubicacionAnimalesInput,
} from '../domain/types'
import type { TipoInstalacion } from '../../shared/domain/types'
import type { DbRow } from '../../../shared/db/helpers'
import type { UUID } from '../../../shared/types'

type InstalacionRow = DbRow<'instalacion'>

type InstalacionRowWithCount = InstalacionRow & {
  animal: { count: number }[] | null
}

// ─── Read mappers ────────────────────────────────────────────────────────────

export function mapInstalacionRowToDomain(row: InstalacionRow): Instalacion {
  return {
    id:              row.id,
    nombre:          row.nombre,
    tipo:            row.tipo as TipoInstalacion,
    activo:          row.activo,
    admite_animales: row.admite_animales,
    admite_stock:    row.admite_stock,
    coordenadas:     row.coordenadas as { lat: number; lng: number } | null,
    observaciones:   row.observaciones,
    created_at:      row.created_at,
    created_by:      row.created_by,
  }
}

export function mapInstalacionRowToListItem(row: InstalacionRowWithCount): InstalacionListItem {
  return {
    id:              row.id,
    nombre:          row.nombre,
    tipo:            row.tipo as TipoInstalacion,
    activo:          row.activo,
    admite_animales: row.admite_animales,
    admite_stock:    row.admite_stock,
    num_animales:    row.animal?.[0]?.count ?? 0,
    coordenadas:     row.coordenadas as { lat: number; lng: number } | null,
    observaciones:   row.observaciones,
  }
}

export function mapInstalacionRowToDetalle(row: InstalacionRowWithCount): InstalacionDetalle {
  return {
    ...mapInstalacionRowToDomain(row),
    num_animales: row.animal?.[0]?.count ?? 0,
  }
}

// Fila de animal con joins para la lista de animales en instalación
type AnimalEnInstalacionRow = {
  id: string
  crotal: string | null
  nombre: string | null
  especie: string
  sexo: string | null
  tipo_productivo: { nombre: string } | null
}

export function mapAnimalEnInstalacionRow(
  row: AnimalEnInstalacionRow,
  fechaUbicacion: string,
): AnimalEnInstalacion {
  return {
    id:                      row.id,
    crotal:                  row.crotal,
    nombre:                  row.nombre,
    especie:                 row.especie as AnimalEnInstalacion['especie'],
    sexo:                    row.sexo as AnimalEnInstalacion['sexo'],
    tipo_productivo_nombre:  row.tipo_productivo?.nombre ?? null,
    fecha_ubicacion:         fechaUbicacion,
  }
}

// Fila del historial de ubicaciones de un animal
type HistorialRow = {
  id: string
  fecha: string
  metadata_json: Record<string, unknown> | null
  origen: { nombre: string } | null
  destino: { nombre: string } | null
}

export function mapHistorialRow(row: HistorialRow): HistorialUbicacionItem {
  return {
    evento_id:                     row.id,
    fecha:                         row.fecha,
    instalacion_origen_nombre:     row.origen?.nombre ?? null,
    instalacion_destino_nombre:    row.destino?.nombre ?? null,
    contexto:                      (row.metadata_json?.contexto as string) ?? null,
  }
}

// ─── Write mappers ───────────────────────────────────────────────────────────

export function mapCrearInstalacionToInsert(input: CrearInstalacionInput) {
  return {
    nombre:          input.nombre.trim(),
    tipo:            input.tipo,
    admite_animales: input.admite_animales ?? true,
    admite_stock:    input.admite_stock    ?? false,
    coordenadas:     input.coordenadas     ?? null,
    observaciones:   input.observaciones   ?? null,
  }
}

type InstalacionUpdate = {
  nombre?: string
  tipo?: TipoInstalacion
  coordenadas?: { lat: number; lng: number } | null
  observaciones?: string | null
}

export function mapActualizarInstalacionToUpdate(input: ActualizarInstalacionInput): InstalacionUpdate {
  const update: InstalacionUpdate = {}
  if (input.nombre        !== undefined) update.nombre        = input.nombre.trim()
  if (input.tipo          !== undefined) update.tipo          = input.tipo
  if (input.coordenadas   !== undefined) update.coordenadas   = input.coordenadas
  if (input.observaciones !== undefined) update.observaciones = input.observaciones
  return update
}

export function mapConfigurarUsosToUpdate(input: ConfigurarUsosInstalacionInput) {
  return {
    admite_animales: input.admite_animales,
    admite_stock:    input.admite_stock,
  }
}

export function mapReubicacionInputToRpcArgs(input: RegistrarReubicacionAnimalesInput) {
  return {
    p_animal_ids:            input.animal_ids,
    p_ubicacion_destino_id:  input.ubicacion_destino_id,
    p_fecha:                 input.fecha,
  }
}

export type { InstalacionRow, InstalacionRowWithCount, AnimalEnInstalacionRow, HistorialRow }
export type ReubicacionRpcResult = {
  ok: boolean
  procesados: number
  ubicacion_destino_id: UUID
  fecha: string
}
