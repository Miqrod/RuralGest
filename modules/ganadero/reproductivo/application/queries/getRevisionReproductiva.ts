import { createServerClient } from '../../../../shared/db'
import { getParametrizacion } from '../../../shared/application/getParametrizacion'
import type { ISODate, UUID } from '../../../../shared/types'
import type { EstadoReproductivo } from '../../../shared/domain/types'

export interface AnimalEnRevisionReproductiva {
  id:                  UUID
  crotal:              string | null
  nombre:              string | null
  estado_reproductivo: EstadoReproductivo
  // Calculado en aplicación como hoy - fecha_inicio_ciclo (equivale a CURRENT_DATE - fecha_inicio)
  dias_en_ciclo:       number
  fecha_inicio_ciclo:  ISODate
}

export interface RevisionReproductiva {
  animales:   AnimalEnRevisionReproductiva[]
  umbralDias: number
}

// ── Lógica pura exportada para tests ─────────────────────────────────────────

export interface RawAnimalRevision {
  id:                  string
  crotal:              string | null
  nombre:              string | null
  estado_reproductivo: string
}

export interface RawCicloRevision {
  id:           string
  animal_id:    string
  fecha_inicio: string
  numero_ciclo: number
}

// Filtra y ordena animales en revisión a partir de datos ya cargados desde DB.
// hoy debe ser la fecha actual normalizada a medianoche (setHours(0,0,0,0))
// para replicar el comportamiento de CURRENT_DATE - fecha_inicio en PG.
// Los ciclos deben llegar ordenados por numero_ciclo DESC (el primero que se
// encuentre por animal_id es el más reciente).
export function filtrarEnRevision(
  animales:   RawAnimalRevision[],
  ciclos:     RawCicloRevision[],
  umbralDias: number,
  hoy:        Date,
): AnimalEnRevisionReproductiva[] {
  // Un ciclo por animal — el más reciente (los ciclos vienen ordenados DESC)
  const cicloMap = new Map<string, RawCicloRevision>()
  for (const c of ciclos) {
    if (!cicloMap.has(c.animal_id)) cicloMap.set(c.animal_id, c)
  }

  const resultado: AnimalEnRevisionReproductiva[] = []

  for (const animal of animales) {
    const ciclo = cicloMap.get(animal.id)
    if (!ciclo) continue

    const fechaInicio = new Date(ciclo.fecha_inicio)
    fechaInicio.setHours(0, 0, 0, 0)
    const diasEnCiclo = Math.floor((hoy.getTime() - fechaInicio.getTime()) / 86_400_000)

    if (diasEnCiclo > umbralDias) {
      resultado.push({
        id:                  animal.id,
        crotal:              animal.crotal,
        nombre:              animal.nombre,
        estado_reproductivo: animal.estado_reproductivo as EstadoReproductivo,
        dias_en_ciclo:       diasEnCiclo,
        fecha_inicio_ciclo:  ciclo.fecha_inicio as ISODate,
      })
    }
  }

  // Más días en ciclo primero — los casos más urgentes aparecen al inicio
  return resultado.sort((a, b) => b.dias_en_ciclo - a.dias_en_ciclo)
}

// ── Query principal ───────────────────────────────────────────────────────────

export async function getRevisionReproductiva(): Promise<RevisionReproductiva> {
  // El umbral se lee de parametrizacion, nunca hardcodeado
  const param = await getParametrizacion('umbral_revision_reproductiva_dias', 'vacuno')
  if (!param) throw new Error('Parámetro umbral_revision_reproductiva_dias no encontrado para vacuno')
  const umbralDias = parseInt(param.valor, 10)

  const supabase = await createServerClient()

  // Paso 1: hembras vivas, reproductoras, en estado susceptible de revisión
  const { data: animales, error: errAnimales } = await supabase
    .from('animal')
    .select('id, crotal, nombre, estado_reproductivo')
    .eq('sexo', 'hembra')
    .eq('estado_vital', 'vivo')
    .eq('es_reproductora', true)
    .in('estado_reproductivo', ['vacia', 'cubierta'])

  if (errAnimales) throw errAnimales
  if (!animales?.length) return { animales: [], umbralDias }

  const animalIds = animales.map((a) => a.id)

  // Paso 2: ciclos abiertos de esos animales, más reciente primero
  // Un animal puede tener excepcionalmente más de un ciclo sin fecha_fin (ver repository.ts).
  const { data: ciclos, error: errCiclos } = await supabase
    .from('ciclo_reproductivo')
    .select('id, animal_id, fecha_inicio, numero_ciclo')
    .in('animal_id', animalIds)
    .is('fecha_fin', null)
    .is('resultado', null)
    .order('numero_ciclo', { ascending: false })

  if (errCiclos) throw errCiclos
  if (!ciclos?.length) return { animales: [], umbralDias }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  return {
    animales:   filtrarEnRevision(animales, ciclos, umbralDias, hoy),
    umbralDias,
  }
}
