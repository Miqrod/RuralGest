// Tipos del dominio analítico reproductivo.
// Representan proyecciones calculadas para la pantalla /analitica/reproduccion.
// No son entidades de BD directas — son el contrato entre queries y componentes.

import type { ISODate, UUID } from '@/modules/shared/types'
import type { Especie, EstadoReproductivo } from '@/modules/ganadero/shared/domain/types'

// ── Periodo de análisis ───────────────────────────────────────────────────────

// Presets de rango temporal para el selector de periodo (#17).
export type PresetPeriodo =
  | 'ultimo_mes'
  | 'ultimo_trimestre'
  | 'ultimo_semestre'
  | 'ultimo_anio'
  | 'personalizado'

export interface PeriodoAnalisis {
  desde:  ISODate
  hasta:  ISODate
  preset: PresetPeriodo
}

// ── Situación reproductiva actual (#18) ───────────────────────────────────────
// Distribución del censo reproductor por estado en el momento de la consulta.

export interface DistribucionEstadoReproductivo {
  estado:     EstadoReproductivo
  total:      number
  // 0–100, redondeado a 1 decimal. Relativo al total de reproductoras activas.
  porcentaje: number
}

export interface SituacionReproductivaActual {
  especie:             Especie
  totalReproductoras:  number
  distribucion:        DistribucionEstadoReproductivo[]
  fechaConsulta:       ISODate
}

// ── Actividad reproductiva histórica (#20) ────────────────────────────────────
// Serie temporal de eventos agrupados en buckets (mes o trimestre según el periodo).

export interface MetricasReproductivas {
  // Conteos de eventos registrados en el periodo
  cubriciones:    number
  confirmaciones: number
  partos:         number
  abortos:        number
  machorras:      number
  // Crías por parto (sumatorio de evento_parto)
  criasNacidas:   number
  criasVivas:     number
  criasMuertas:   number
  // Ciclos cerrados con resultado conocido (partos + abortos + machorras).
  ciclosCerrados: number
  // Tasas derivadas — calculadas a nivel de periodo completo, no por bucket,
  // ya que requieren seguir cada gestación hasta su desenlace final.
  tasaGestacion:  number | null
  tasaFertilidad: number | null
  tasaAborto:     number | null
}

export interface BucketActividad {
  desde:    ISODate
  hasta:    ISODate
  // Etiqueta legible para el eje temporal, generada en la query (ej. "Mar 2026", "T1 2026")
  label:    string
  metricas: MetricasReproductivas
}

export interface ActividadReproductivaHistorica {
  periodo: PeriodoAnalisis
  buckets: BucketActividad[]
  // Suma acumulada del periodo completo (no media de buckets)
  totales: MetricasReproductivas
}

// ── Seguimiento de crías (#21) ────────────────────────────────────────────────
// Crías vivas con vínculo materno activo, ordenadas por días desde el nacimiento DESC.

export interface CriaEnSeguimiento {
  id:                  UUID
  crotal:              string | null
  nombre:              string | null
  madreId:             UUID
  madreCrotal:         string | null
  madreNombre:         string | null
  fechaNacimiento:     ISODate
  // Calculado en aplicación: floor((hoy - fechaNacimiento) / 86_400_000)
  diasDesdeNacimiento: number
  tipoProductivo:      string | null
  ubicacionNombre:     string | null
}

export interface SeguimientoCrias {
  total: number
  crias: CriaEnSeguimiento[]
}

// ── Desenlaces de crías del periodo ──────────────────────────────────────────
// Seguimiento de todas las crías nacidas vivas en el periodo hasta su desenlace,
// independientemente de si éste ocurre dentro o fuera del rango seleccionado.

export type DesenlaceCria =
  | 'destete_natural'       // vínculo cerrado explícitamente por el ganadero
  | 'destete_forzado'       // madre murió o fue vendida antes del destete
  | 'vendida_antes_destete' // la cría fue vendida con vínculo activo
  | 'muerte_antes_destete'  // la cría murió con vínculo activo
  | 'aun_lactante'          // vínculo activo a fecha de consulta

export interface ConteoDesenlace {
  desenlace:   DesenlaceCria
  total:       number
  // 0–100, redondeado a 1 decimal. Relativo al total de nacidas vivas.
  porcentaje:  number
}

export interface DesenlacesCriasPeriodo {
  periodo:        PeriodoAnalisis
  nacidasVivas:   number
  nacidasMuertas: number  // informativo: excluidas del total y los desenlaces
  desenlaces:     ConteoDesenlace[]
}
