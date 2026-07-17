import type { UUID, ISODate, ISOTimestamp } from '../../../shared/types'
import type { Especie, EstadoReproductivo, ResultadoCiclo } from '../../shared/domain/types'

// ─── Entidad de persistencia ────────────────────────────────────────────────

export interface CicloReproductivo {
  id: UUID
  animal_id: UUID
  numero_ciclo: number
  fecha_inicio: ISODate
  fecha_fin: ISODate | null
  resultado: ResultadoCiclo | null
  created_at: ISOTimestamp
  created_by: UUID | null
}

// ─── Inputs de casos de uso ─────────────────────────────────────────────────

export type TipoCubricion = 'natural' | 'inseminacion'

export interface RegistrarCubricionInput {
  animal_id:       UUID
  fecha_cubricion: ISODate
  tipo_cubricion:  TipoCubricion
  macho_id?:       UUID          // solo para cubrición natural
  observaciones?:  string
}

export interface RegistrarConfirmacionGestacionInput {
  animal_id:             UUID
  fecha_confirmacion:    ISODate
  observaciones?:        string
}

// ─── Tipos del patrón CRP ───────────────────────────────────────────────────

// Códigos de evento reproductivo válidos. Coinciden con las claves de TRANSICIONES en rules.ts.
export type CodigoEventoReproductivo = 'CUBRICION' | 'CONFIRMACION_GESTACION' | 'PARTO' | 'DESTETE' | 'ABORTO'

// Slice mínimo de Animal que necesita el dominio reproductivo.
// Evita importar el tipo Animal completo desde el módulo de animales.
export interface AnimalReproductivoInfo {
  id: UUID
  especie: Especie
  es_reproductora: boolean
  estado_reproductivo: EstadoReproductivo | null
}

// Data bag inmutable que el Use Case construye antes de invocar cualquier Rule.
// No contiene lógica, solo agrupa la información necesaria para interpretar un evento.
export interface ReproductiveContext {
  animal: AnimalReproductivoInfo
  cicloAbierto: CicloReproductivo | null
  eventoSolicitado: CodigoEventoReproductivo
  fechaEvento: ISODate
}

// Decisión que devuelve ReproductiveCycleRules tras evaluar el contexto.
// El Use Case actúa sobre ella: llama a abrirCiclo() o reutiliza el cicloId existente.
export type ReproductiveCycleAction = 'crear' | 'reutilizar'
export interface ReproductiveCycleDecision {
  accion: ReproductiveCycleAction
  cicloId: UUID | null  // null cuando accion = 'crear' (el id se asigna tras insertar)
}

// Proyección derivada que ReproductiveProjection construye a partir del contexto.
// Todos los campos son calculados; ninguno es fuente de verdad.
// diasRestantes no se persiste: se recalcula en UI como fecha_prevista_parto - hoy.
export interface ReproductiveSnapshot {
  estadoReproductivo: EstadoReproductivo
  cicloActivoId: UUID | null
  fechaPrevistaParto: ISODate | null
  diasRestantes: number | null
}
