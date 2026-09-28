import { startOfMonth, endOfMonth, addMonths, format, parse } from 'date-fns'
import { es } from 'date-fns/locale'
import { createServerClient } from '../../../../shared/db'
import type { Especie } from '../../../shared/domain/types'
import type {
  PeriodoAnalisis,
  ActividadReproductivaHistorica,
  BucketActividad,
  MetricasReproductivas,
} from '../../domain/analytics'

// DESTETE excluido: pertenece a un parto anterior, mezclaría periodos distintos.
const CODIGOS_REPRODUCTIVOS = [
  'CUBRICION',
  'CONFIRMACION_GESTACION',
  'PARTO',
  'ABORTO',
  'MACHORRA',
] as const

type CodigoReproductivo = (typeof CODIGOS_REPRODUCTIVOS)[number]

// ── Buckets ───────────────────────────────────────────────────────────────────

function isoToDate(iso: string): Date {
  return parse(iso, 'yyyy-MM-dd', new Date())
}

export function generarBuckets(desde: string, hasta: string): Omit<BucketActividad, 'metricas'>[] {
  const buckets: Omit<BucketActividad, 'metricas'>[] = []
  let cursor = startOfMonth(isoToDate(desde))
  const fin = startOfMonth(isoToDate(hasta))

  while (cursor <= fin) {
    buckets.push({
      desde: format(cursor, 'yyyy-MM-dd'),
      hasta: format(endOfMonth(cursor), 'yyyy-MM-dd'),
      label: format(cursor, 'MMM yyyy', { locale: es }),
    })
    cursor = addMonths(cursor, 1)
  }

  return buckets
}

// ── Métricas ──────────────────────────────────────────────────────────────────

export function metricsVacias(): MetricasReproductivas {
  return {
    cubriciones: 0,
    confirmaciones: 0,
    partos: 0,
    abortos: 0,
    machorras: 0,
    criasNacidas: 0,
    criasVivas: 0,
    criasMuertas: 0,
    ciclosCerrados: 0,
    tasaGestacion: null,
    tasaFertilidad: null,
    tasaAborto: null,
  }
}

export function calcularTasas(m: MetricasReproductivas): MetricasReproductivas {
  const ciclosCerrados = m.partos + m.abortos + m.machorras
  return {
    ...m,
    ciclosCerrados,
    tasaGestacion:
      m.cubriciones > 0
        ? Math.round((m.confirmaciones / m.cubriciones) * 1000) / 10
        : null,
    tasaFertilidad:
      ciclosCerrados > 0
        ? Math.round((m.partos / ciclosCerrados) * 1000) / 10
        : null,
    tasaAborto:
      ciclosCerrados > 0
        ? Math.round((m.abortos / ciclosCerrados) * 1000) / 10
        : null,
  }
}

type EventoParto = { numero_nacidos: number; numero_vivos: number; numero_muertos: number }

export function acumularEvento(
  m: MetricasReproductivas,
  codigo: CodigoReproductivo,
  eventoParto: EventoParto | null,
): void {
  if (codigo === 'CUBRICION') m.cubriciones++
  else if (codigo === 'CONFIRMACION_GESTACION') m.confirmaciones++
  else if (codigo === 'PARTO') {
    m.partos++
    if (eventoParto) {
      m.criasNacidas  += eventoParto.numero_nacidos
      m.criasVivas    += eventoParto.numero_vivos
      m.criasMuertas  += eventoParto.numero_muertos
    }
  }
  else if (codigo === 'ABORTO')   m.abortos++
  else if (codigo === 'MACHORRA') m.machorras++
}

// ── Query principal ───────────────────────────────────────────────────────────

export async function getHistoricalReproductiveActivity(
  especie: Especie,
  periodo: PeriodoAnalisis,
): Promise<ActividadReproductivaHistorica> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('eventos')
    .select('fecha, tipo_evento(codigo), evento_parto(numero_nacidos, numero_vivos, numero_muertos)')
    .eq('especie', especie)
    .gte('fecha', periodo.desde)
    .lte('fecha', periodo.hasta)
    .order('fecha', { ascending: true })

  if (error) throw error

  const CODIGOS_SET = new Set<string>(CODIGOS_REPRODUCTIVOS)
  const bucketsDefs = generarBuckets(periodo.desde, periodo.hasta)
  const metricas = bucketsDefs.map(() => metricsVacias())
  const totales = metricsVacias()

  for (const row of data ?? []) {
    const te = row.tipo_evento as { codigo: string } | { codigo: string }[] | null
    const codigo = (Array.isArray(te) ? te[0]?.codigo : te?.codigo) ?? ''
    if (!CODIGOS_SET.has(codigo)) continue
    const typedCodigo = codigo as CodigoReproductivo

    const epRaw = row.evento_parto as unknown
    const eventoParto = (Array.isArray(epRaw) ? epRaw[0] : epRaw) as EventoParto | null

    const idx = bucketsDefs.findIndex(
      (b) => row.fecha >= b.desde && row.fecha <= b.hasta,
    )
    if (idx !== -1) acumularEvento(metricas[idx], typedCodigo, eventoParto)
    acumularEvento(totales, typedCodigo, eventoParto)
  }

  const buckets: BucketActividad[] = bucketsDefs.map((def, i) => ({
    ...def,
    metricas: calcularTasas(metricas[i]),
  }))

  return {
    periodo,
    buckets,
    totales: calcularTasas(totales),
  }
}
