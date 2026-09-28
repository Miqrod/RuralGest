'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { actualizarParametrizacion } from './actions'
import type {
  Parametrizacion,
  CategoriaParametrizacion,
  TipoValorParametrizacion,
  UnidadParametrizacion,
} from '@/modules/ganadero/parametrizacion/domain/types'

// ─── Labels ──────────────────────────────────────────────────────────────────

const CATEGORIA_LABELS: Record<CategoriaParametrizacion, string> = {
  REPRODUCTIVO: 'Reproductivo',
  FINANCIERO:   'Financiero',
  OPERATIVO:    'Operativo',
}

const UNIDAD_LABELS: Record<UnidadParametrizacion, string> = {
  DIAS:        'días',
  EUROS:       '€',
  PORCENTAJE:  '%',
  KG:          'kg',
  UNIDADES:    'uds.',
}

const ESPECIE_LABELS: Record<string, string> = {
  vacuno:  'Vacuno',
  porcino: 'Porcino',
}

// ─── Input por tipo ───────────────────────────────────────────────────────────

function ValorInput({
  tipo,
  value,
  onChange,
  disabled,
}: {
  tipo: TipoValorParametrizacion
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  if (tipo === 'BOOLEAN') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'h-9 rounded-md border border-divider bg-surface-base px-3 text-sm text-ink',
          'focus:outline-none focus:ring-2 focus:ring-world/30',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>
    )
  }
  return (
    <Input
      type={tipo === 'DATE' ? 'date' : tipo === 'INTEGER' || tipo === 'DECIMAL' ? 'number' : 'text'}
      step={tipo === 'DECIMAL' ? '0.01' : tipo === 'INTEGER' ? '1' : undefined}
      inputMode={tipo === 'INTEGER' ? 'numeric' : tipo === 'DECIMAL' ? 'decimal' : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-32"
    />
  )
}

// ─── Fila individual ─────────────────────────────────────────────────────────

function ParametrizacionRow({ param }: { param: Parametrizacion }) {
  const [value, setValue]   = useState(param.valor)
  const [error, setError]   = useState<string | null>(null)
  const [saved, setSaved]   = useState(false)
  const [pending, startTransition] = useTransition()

  const isDirty = value.trim() !== param.valor.trim()

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await actualizarParametrizacion(param.id, value)
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
        // Confirma el valor guardado para que isDirty sea false
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  return (
    <div className="flex flex-col gap-1 py-3 border-b border-divider/50 last:border-0">
      <div className="flex items-center gap-3">
        {/* Descripción + badge inline, ocupa el espacio disponible */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <p className="text-sm text-ink">{param.descripcion}</p>
          {param.especie && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-alt text-ink-muted shrink-0">
              {ESPECIE_LABELS[param.especie] ?? param.especie}
            </span>
          )}
        </div>

        {/* Campo + unidad + botón — alineado a la derecha */}
        <div className="flex items-center gap-2 shrink-0">
          <ValorInput tipo={param.tipo_valor} value={value} onChange={setValue} disabled={pending} />
          {param.unidad && (
            <span className="text-sm text-ink-muted">{UNIDAD_LABELS[param.unidad]}</span>
          )}
          <Button
            type="button"
            variant={isDirty ? 'default' : 'outline'}
            disabled={pending || !isDirty}
            onClick={handleSave}
            className="shrink-0"
          >
            {pending ? 'Guardando…' : saved ? 'Guardado' : 'Guardar'}
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-alert">{error}</p>}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  parametrizaciones: Parametrizacion[]
}

export function FormParametrizaciones({ parametrizaciones }: Props) {
  // Agrupar por categoría manteniendo el orden natural de los enums
  const orden: CategoriaParametrizacion[] = ['REPRODUCTIVO', 'FINANCIERO', 'OPERATIVO']
  const grouped = parametrizaciones.reduce<Record<string, Parametrizacion[]>>((acc, p) => {
    ;(acc[p.categoria] ??= []).push(p)
    return acc
  }, {})

  const categoriasConDatos = orden.filter((c) => grouped[c]?.length)

  if (categoriasConDatos.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No hay parámetros configurables disponibles.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Título ────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-world">Parametrizaciones</h1>
        <p className="text-sm text-ink-muted mt-1">
          Valores configurables del sistema agrupados por módulo.
        </p>
      </div>

      {/* Contenido en card para consistencia visual con el resto de la app */}
      <div className="bg-canvas rounded-xl border border-divider/30 shadow-sm p-6 md:p-8 max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-8">

      {categoriasConDatos.map((categoria) => (
        <section key={categoria}>
          {/* Cabecera de categoría */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-widest whitespace-nowrap">
              {CATEGORIA_LABELS[categoria]}
            </span>
            <div className="flex-1 h-px bg-divider/60" />
          </div>

          <div>
            {grouped[categoria]!.map((param) => (
              <ParametrizacionRow key={param.id} param={param} />
            ))}
          </div>
        </section>
      ))}

      </div>
      </div>
    </div>
  )
}
