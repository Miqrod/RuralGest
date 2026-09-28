import { format, subMonths, subYears, parse } from 'date-fns'
import type { PeriodoAnalisis, PresetPeriodo } from './analytics'

export function isoToDate(iso: string): Date {
  return parse(iso, 'yyyy-MM-dd', new Date())
}

// Función pura: calcula desde/hasta relativo a `hoy` para cada preset no-personalizado.
// Separada del componente SelectorPeriodo para poder importarla desde Server Components.
export function calcularPeriodo(
  preset: Exclude<PresetPeriodo, 'personalizado'>,
  hoy: Date = new Date(),
): PeriodoAnalisis {
  const hasta = format(hoy, 'yyyy-MM-dd')

  const inicio: Record<Exclude<PresetPeriodo, 'personalizado'>, Date> = {
    ultimo_mes:       subMonths(hoy, 1),
    ultimo_trimestre: subMonths(hoy, 3),
    ultimo_semestre:  subMonths(hoy, 6),
    ultimo_anio:      subYears(hoy, 1),
  }

  return { desde: format(inicio[preset], 'yyyy-MM-dd'), hasta, preset }
}
