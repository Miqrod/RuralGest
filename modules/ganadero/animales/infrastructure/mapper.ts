import type { DbRow, DbInsert } from '../../../shared/db/helpers'
import type { Animal, RegistrarCompraAnimalInput } from '../domain/types'
import type { UUID } from '../../../shared/types'

// El repositorio hace select('*, raza(nombre), tipo_productivo(nombre)'), por lo
// que la fila incluye los nombres resueltos. Este tipo permanece en infrastructure.
type AnimalRowWithJoins = DbRow<'animal'> & {
  raza:            { nombre: string } | null
  tipo_productivo: { nombre: string } | null
}

// ─── Write mappers (domain input → DB insert) ───────────────────────────────
// Funciones puras: no hacen queries, no tienen efectos secundarios.
// El repositorio resuelve los IDs de catálogo y los pasa como parámetros.

// Produce la fila a insertar en `eventos` para registrar la entrada del animal.
// tipoEventoId: UUID del tipo 'ENTRADA' (catálogo tipo_evento, resuelto por el repositorio).
// motivoId:     UUID del motivo 'COMPRA' (catálogo motivos_movimiento, resuelto por el repositorio).
export function mapCompraInputToEventoInsert(
  input: RegistrarCompraAnimalInput,
  tipoEventoId: UUID,
  motivoId: UUID,
): DbInsert<'eventos'> {
  return {
    especie:        input.especie,
    fecha:          input.fecha_compra,  // fecha en que ocurrió la compra, no la inserción
    tipo_evento_id: tipoEventoId,
    motivo_id:      motivoId,
  }
}

// Produce la fila a insertar en `animal`.
// eventoId:       ID del evento recién creado; enlaza el animal a su origen (trazabilidad).
// esReproductora: flag calculado por el repositorio a partir del tipo_productivo.nombre,
//                 porque determinarlo requiere una query que el mapper no puede hacer.
// Los campos con default (estado_vital, estado_sanitario, origen) se fijan aquí y no
// viajan en el input: son invariantes de negocio para una compra, no decisión del usuario.
export function mapCompraInputToAnimalInsert(
  input: RegistrarCompraAnimalInput,
  eventoId: UUID,
  esReproductora: boolean,
): DbInsert<'animal'> {
  return {
    especie:                   input.especie,
    sexo:                      input.sexo,
    origen:                    'compra',   // implícito: este mapper es solo para compras
    tipo_productivo_id:        input.tipo_productivo_id,
    crotal:                    input.crotal                    ?? null,
    num_hierro:                input.num_hierro                ?? null,
    raza_id:                   input.raza_id                   ?? null,
    fecha_nacimiento:          input.fecha_nacimiento          ?? null,
    fecha_nacimiento_estimada: input.fecha_nacimiento_estimada ?? null,
    lote_id:                   input.lote_id                   ?? null,
    evento_creacion_id:        eventoId,
    evento_origen_id:          eventoId,
    es_reproductora:           esReproductora,
    estado_vital:              'vivo',     // todo animal que entra está vivo
    estado_sanitario:          'sano',     // estado inicial por defecto; cambia vía eventos
    estado_reproductivo:       null,       // se asigna cuando se inicia un ciclo reproductivo
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
