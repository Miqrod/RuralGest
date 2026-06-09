import type { DbRow } from '../../../shared/db/helpers'
import type { Animal } from '../domain/types'

// El repositorio hace select('*, raza(nombre), tipo_productivo(nombre)'), por lo
// que la fila incluye los nombres resueltos. Este tipo permanece en infrastructure.
type AnimalRowWithJoins = DbRow<'animal'> & {
  raza:            { nombre: string } | null
  tipo_productivo: { nombre: string } | null
}

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
