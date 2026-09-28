import { createServerClient } from '../../../../shared/db'
import { format } from 'date-fns'
import type { Especie, EstadoReproductivo } from '../../../shared/domain/types'
import type {
  SituacionReproductivaActual,
  DistribucionEstadoReproductivo,
} from '../../domain/analytics'

// Orden canónico de visualización: refleja el ciclo reproductivo de menos a más avanzado
const ORDEN_ESTADO: EstadoReproductivo[] = ['vacia', 'cubierta', 'gestante']

// Calcula la distribución porcentual por estado a partir de filas crudas de DB.
// Incluye los 3 estados canónicos aunque tengan 0 animales.
// Porcentaje redondeado a 1 decimal relativo al total de reproductoras.
export function calcularDistribucion(
  rows: { estado_reproductivo: string | null }[],
): { totalReproductoras: number; distribucion: DistribucionEstadoReproductivo[] } {
  const totalReproductoras = rows.length

  const conteos = new Map<EstadoReproductivo, number>()
  for (const row of rows) {
    const estado = row.estado_reproductivo as EstadoReproductivo
    conteos.set(estado, (conteos.get(estado) ?? 0) + 1)
  }

  const distribucion: DistribucionEstadoReproductivo[] = ORDEN_ESTADO.map((estado) => {
    const total = conteos.get(estado) ?? 0
    const porcentaje =
      totalReproductoras > 0
        ? Math.round((total / totalReproductoras) * 1000) / 10
        : 0
    return { estado, total, porcentaje }
  })

  return { totalReproductoras, distribucion }
}

export async function getCurrentReproductiveSituation(
  especie: Especie,
): Promise<SituacionReproductivaActual> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('animal')
    .select('estado_reproductivo')
    .eq('especie', especie)
    .eq('es_reproductora', true)
    .eq('estado_vital', 'vivo')
    .not('estado_reproductivo', 'is', null)

  if (error) throw error

  const { totalReproductoras, distribucion } = calcularDistribucion(data ?? [])

  return {
    especie,
    totalReproductoras,
    distribucion,
    fechaConsulta: format(new Date(), 'yyyy-MM-dd'),
  }
}
