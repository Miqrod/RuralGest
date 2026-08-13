import { createServerClient } from '../../../../shared/db'

export interface DesgloseTipoProductivo {
  nombre: string
  count: number
}

export interface CensoVacunoVivo {
  total: number
  porTipoProductivo: DesgloseTipoProductivo[]
}

// Orden semántico de etapas productivas para el desglose del censo.
// Las etapas desconocidas van al final, ordenadas alfabéticamente.
const TIPO_ORDER: Record<string, number> = {
  'Cría':         0,
  'Recría':       1,
  'Engorde':      2,
  'Reproductora': 3,
  'Semental':     4,
}

// Devuelve el censo de vacuno vivo, con desglose por tipo productivo en orden semántico de ciclo de vida.
export async function getCensoVacunoVivo(): Promise<CensoVacunoVivo> {
  const supabase = await createServerClient()

  // Una sola query: trae solo el nombre del tipo productivo por animal vivo
  const { data, error } = await supabase
    .from('animal')
    .select('tipo_productivo(nombre)')
    .eq('especie', 'vacuno')
    .eq('estado_vital', 'vivo')

  if (error) throw error

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const nombre = (row.tipo_productivo as { nombre: string } | null)?.nombre ?? 'Sin clasificar'
    counts[nombre] = (counts[nombre] ?? 0) + 1
  }

  const porTipoProductivo = Object.entries(counts)
    .map(([nombre, count]) => ({ nombre, count }))
    .sort((a, b) => {
      const oa = TIPO_ORDER[a.nombre] ?? 99
      const ob = TIPO_ORDER[b.nombre] ?? 99
      return oa !== ob ? oa - ob : a.nombre.localeCompare(b.nombre)
    })

  return {
    total: (data ?? []).length,
    porTipoProductivo,
  }
}
