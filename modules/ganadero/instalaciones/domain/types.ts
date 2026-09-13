import type { UUID, ISODate, ISOTimestamp } from '../../../shared/types'
import type { Especie, Sexo, TipoInstalacion } from '../../shared/domain/types'

// ── Entidad completa ──────────────────────────────────────────────────────────

export interface Instalacion {
  id: UUID
  nombre: string
  tipo: TipoInstalacion
  activo: boolean
  admite_animales: boolean  // válida como destino de CAMBIO_UBICACION
  admite_stock: boolean     // puede almacenar stock físico (paja, pienso, medicamentos…)
  coordenadas: { lat: number; lng: number } | null
  observaciones: string | null
  created_at: ISOTimestamp
  created_by: UUID | null
}

// ── Proyecciones para UI ──────────────────────────────────────────────────────

// Para listados: sin coordenadas ni observaciones, con conteo de animales actuales
export interface InstalacionListItem {
  id: UUID
  nombre: string
  tipo: TipoInstalacion
  activo: boolean
  admite_animales: boolean
  admite_stock: boolean
  num_animales: number
  coordenadas: { lat: number; lng: number } | null
  observaciones: string | null
}

// Para pantalla de detalle: entidad completa + conteo
export interface InstalacionDetalle extends Instalacion {
  num_animales: number
}

// Animal actualmente asignado a una instalación
export interface AnimalEnInstalacion {
  id: UUID
  crotal: string | null
  nombre: string | null
  especie: Especie
  sexo: Sexo
  tipo_productivo_nombre: string | null
  fecha_ubicacion: ISODate  // fecha del CAMBIO_UBICACION que lo colocó aquí
}

// Entrada del historial de ubicaciones de un animal concreto
export interface HistorialUbicacionItem {
  evento_id: UUID
  fecha: ISODate
  instalacion_origen_nombre: string | null   // NULL = sin ubicación previa (primera alta)
  instalacion_destino_nombre: string | null  // NULL = salida del sistema (venta/muerte)
  contexto: string | null                    // metadata_json.contexto: 'parto'|'compra'|'venta'|'muerte'|NULL
}

// ── Inputs de mutación ────────────────────────────────────────────────────────

export interface CrearInstalacionInput {
  nombre: string
  tipo: TipoInstalacion
  admite_animales?: boolean  // default true en DB
  admite_stock?: boolean     // default false en DB
  coordenadas?: { lat: number; lng: number }
  observaciones?: string
}

export interface ActualizarInstalacionInput {
  id: UUID
  nombre?: string
  tipo?: TipoInstalacion
  coordenadas?: { lat: number; lng: number } | null
  observaciones?: string | null
}

// Configurar qué usos admite la instalación (independiente de activar/desactivar)
export interface ConfigurarUsosInstalacionInput {
  id: UUID
  admite_animales: boolean
  admite_stock: boolean
}

// ── Tipos para el flujo de reubicación ───────────────────────────────────────

// Los 4 contextos UX comparten el mismo flujo; solo cambian qué animales se presentan.
export type ModoReubicacion = 'individual' | 'location' | 'pending' | 'global'

// Proyección mínima de un animal para presentarlo en el selector de reubicación.
// Común a todos los modos; cada página rellena este tipo desde su propia query.
export interface AnimalParaReubicar {
  id: UUID
  crotal: string | null
  nombre: string | null
  sexo: Sexo | null
  tipo_productivo_nombre: string | null
  // Fecha del último CAMBIO_UBICACION del animal — determina el mínimo del datepicker.
  // Solo los animales efectivos (no no-op) participan en este cálculo.
  fecha_ultimo_cambio_ubicacion: ISODate | null
  // Ubicación actual — se excluye de las opciones de destino en modo individual.
  // En modo múltiple, determina cuáles son no-op cuando coincide con el destino.
  ubicacion_actual_id: UUID | null
  // Nombre de la ubicación actual — para mostrar "origen → destino" en el desglose.
  ubicacion_actual_nombre: string | null
}

// Instalación elegible como destino: activo=true AND admite_animales=true.
export interface InstalacionDestino {
  id: UUID
  nombre: string
  tipo: TipoInstalacion
}

export interface RegistrarReubicacionAnimalesInput {
  animal_ids: UUID[]
  ubicacion_destino_id: UUID
  fecha: ISODate
}

export interface ReubicacionResult {
  procesados: number
  ubicacion_destino_id: UUID
  fecha: ISODate
}
