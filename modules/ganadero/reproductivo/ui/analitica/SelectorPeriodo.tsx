'use client'

import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'
import { calcularPeriodo, isoToDate } from '@/modules/ganadero/reproductivo/domain/periodo'
import type { PeriodoAnalisis, PresetPeriodo } from '@/modules/ganadero/reproductivo/domain/analytics'


// ── Labels ────────────────────────────────────────────────────────────────────

const PRESET_LABELS: Record<PresetPeriodo, string> = {
  ultimo_mes:       'Último mes',
  ultimo_trimestre: 'Último trimestre',
  ultimo_semestre:  'Último semestre',
  ultimo_anio:      'Último año',
  personalizado:    'Personalizado',
}

const PRESET_ORDER: PresetPeriodo[] = [
  'ultimo_mes',
  'ultimo_trimestre',
  'ultimo_semestre',
  'ultimo_anio',
  'personalizado',
]

// ── Componente ────────────────────────────────────────────────────────────────

interface Props {
  value:      PeriodoAnalisis
  onChange:   (periodo: PeriodoAnalisis) => void
  className?: string
}

export function SelectorPeriodo({ value, onChange, className }: Props) {
  function handlePresetClick(preset: PresetPeriodo) {
    if (preset === 'personalizado') {
      // Mantiene las fechas actuales y muestra los date pickers para que el usuario las ajuste
      onChange({ ...value, preset: 'personalizado' })
    } else {
      onChange(calcularPeriodo(preset))
    }
  }

  function handleDesdeChange(desde: string | undefined) {
    if (!desde) return
    onChange({ ...value, desde, preset: 'personalizado' })
  }

  function handleHastaChange(hasta: string | undefined) {
    if (!hasta) return
    onChange({ ...value, hasta, preset: 'personalizado' })
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>

      {/* Pills de preset */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_ORDER.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border transition-colors duration-150 cursor-pointer',
              value.preset === preset
                ? 'border-world bg-world text-white'
                : preset === 'personalizado'
                  ? 'border-divider bg-surface-alt text-ink-muted hover:border-world/50 hover:text-ink'
                  : 'border-divider bg-transparent text-ink-muted hover:border-world/50 hover:text-ink',
            )}
          >
            {PRESET_LABELS[preset]}
          </button>
        ))}
      </div>

      {/* Date pickers — siempre visibles; desactivados cuando hay preset fijo.
          En modo personalizado el borde y fondo de cada campo se vuelven verdes. */}
      <div className="flex items-center gap-2">
        <DatePicker
          value={value.desde}
          onChange={handleDesdeChange}
          maxDate={value.hasta ? isoToDate(value.hasta) : new Date()}
          placeholder="Desde"
          disabled={value.preset !== 'personalizado'}
          className={cn(
            'w-36 transition-colors duration-200',
            value.preset === 'personalizado' && '!border-world !bg-world/10',
          )}
        />
        <span className="text-sm text-ink-muted">–</span>
        <DatePicker
          value={value.hasta}
          onChange={handleHastaChange}
          minDate={value.desde ? isoToDate(value.desde) : undefined}
          maxDate={new Date()}
          placeholder="Hasta"
          disabled={value.preset !== 'personalizado'}
          className={cn(
            'w-36 transition-colors duration-200',
            value.preset === 'personalizado' && '!border-world !bg-world/10',
          )}
        />
      </div>

    </div>
  )
}
