import type { DbRow } from '../../../shared/db/helpers'
import type { Animal, RegistrarCompraAnimalInput, RegistrarVentaAnimalInput, RegistrarMuerteAnimalInput } from '../domain/types'
import type { UUID } from '../../../shared/types'

// El repositorio hace select('*, raza(nombre), tipo_productivo(nombre)'), por lo
// que la fila incluye los nombres resueltos. Este tipo permanece en infrastructure.
type AnimalRowWithJoins = DbRow<'animal'> & {
  raza:            { nombre: string } | null
  tipo_productivo: { nombre: string } | null
}

// ─── Write mappers (domain input → RPC args) ────────────────────────────────
// Funciones puras: no hacen queries, no tienen efectos secundarios.
// Producen el objeto de parámetros que recibe el RPC de Postgres.
// La resolución de IDs de catálogo y el cálculo de es_reproductora
// se han movido al RPC; el mapper solo traduce nombres de campo.

// El tipo de args lo provee el tipo generado de Supabase (types/supabase.ts).
// Aquí solo traducimos nombres de campo de dominio a nombres de parámetro del RPC.
// Los campos opcionales del RPC usan undefined (no null) según la convención generada.
export function mapCompraInputToRpcArgs(input: RegistrarCompraAnimalInput) {
  return {
    p_especie:                   input.especie,
    p_sexo:                      input.sexo,
    p_tipo_productivo_id:        input.tipo_productivo_id,
    p_fecha_compra:              input.fecha_compra,
    p_crotal:                    input.crotal                    ?? undefined,
    p_num_hierro:                input.num_hierro                ?? undefined,
    p_raza_id:                   input.raza_id                   ?? undefined,
    p_fecha_nacimiento:          input.fecha_nacimiento          ?? undefined,
    p_fecha_nacimiento_estimada: input.fecha_nacimiento_estimada ?? undefined,
    p_lote_id:                   input.lote_id                   ?? undefined,
  }
}

// Args del RPC registrar_salida_animal (ver migration 20260618000001).
// Venta y muerte comparten el mismo RPC — el motivo distingue el caso.
export type SalidaRpcArgs = {
  p_animal_id: UUID
  p_motivo:    string
  p_fecha:     string
}

export function mapVentaInputToRpcArgs(input: RegistrarVentaAnimalInput): SalidaRpcArgs {
  return {
    p_animal_id: input.animal_id,
    p_motivo:    'venta',
    p_fecha:     input.fecha_venta,
  }
}

export function mapMuerteInputToRpcArgs(input: RegistrarMuerteAnimalInput): SalidaRpcArgs {
  return {
    p_animal_id: input.animal_id,
    p_motivo:    'muerte',
    p_fecha:     input.fecha_muerte,
  }
}

// ─── Read mapper (DB row → domain entity) ───────────────────────────────────

export function mapAnimalRowToDomain(row: AnimalRowWithJoins): Animal {
  return {
    id:                        row.id,
    especie:                   row.especie,
    tipo_productivo_id:        row.tipo_productivo_id,
    tipo_productivo_nombre:    row.tipo_productivo?.nombre ?? null,
    crotal:                    row.crotal,
    num_hierro:                row.num_hierro,
    raza_id:                   row.raza_id,
    raza_nombre:               row.raza?.nombre ?? null,
    fecha_nacimiento:          row.fecha_nacimiento,
    fecha_nacimiento_estimada: row.fecha_nacimiento_estimada,
    sexo:                      row.sexo,
    madre_id:                  row.madre_id,
    padre_id:                  row.padre_id,
    es_reproductora:           row.es_reproductora,
    origen:                    row.origen,
    lote_id:                   row.lote_id,
    lote_origen_id:            row.lote_origen_id,
    evento_creacion_id:        row.evento_creacion_id,
    evento_origen_id:          row.evento_origen_id,
    estado_vital:              row.estado_vital,
    estado_reproductivo:       row.estado_reproductivo,
    estado_sanitario:          row.estado_sanitario,
    ubicacion_actual_id:       row.ubicacion_actual_id,
    created_at:                row.created_at,
    created_by:                row.created_by,
    updated_at:                row.updated_at,
    updated_by:                row.updated_by,
  }
}
