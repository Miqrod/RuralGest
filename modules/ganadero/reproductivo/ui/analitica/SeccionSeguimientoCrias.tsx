'use client'

import { BarChart, Bar, Cell, LabelList, ResponsiveContainer, Tooltip } from 'recharts'
import { Info } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { isoStringToDate, formatFecha } from '@/lib/format'
import type { DesenlacesCriasPeriodo, DesenlaceCria } from '../../domain/analytics'

// ── Colores de las barras ─────────────────────────────────────────────────────
// CSS vars donde existan token de tema; hex para colores estándar sin token.

const BAR_FILL: Record<DesenlaceCria, string> = {
  destete_natural:       'var(--color-world)',
  destete_forzado:       'var(--color-warning)',
  aun_lactante:          '#60a5fa',  // blue-400
  vendida_antes_destete: '#a8a29e',  // stone-400
  muerte_antes_destete:  '#ef4444',  // red-500
}

const CONFIG: Record<DesenlaceCria, { label: string; popover?: string }> = {
  destete_natural:       { label: 'Destete natural' },
  destete_forzado:       {
    label:   'Destete forzado',
    popover: 'El vínculo con la madre terminó por venta o muerte de ésta antes del destete. La cría sobrevivió.',
  },
  aun_lactante:          { label: 'Aún lactantes' },
  vendida_antes_destete: { label: 'Vendidas antes del destete' },
  muerte_antes_destete:  { label: 'Muertas antes del destete' },
}

type ChartDatum = { desenlace: DesenlaceCria; total: number; porcentaje: number }

// ── InfoPopover (mismo patrón que el resto de la página) ─────────────────────

function InfoPopover({ content }: { content: string }) {
  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex items-center justify-center text-ink-muted/50 hover:text-ink-muted transition-colors cursor-pointer"
        aria-label="Más información"
      >
        <Info className="h-3.5 w-3.5" />
      </PopoverTrigger>
      <PopoverContent side="top" sideOffset={6} align="end" className="w-56 p-3">
        <p className="text-xs text-ink-muted leading-relaxed">{content}</p>
      </PopoverContent>
    </Popover>
  )
}

// ── Tooltip personalizado ─────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
}: {
  active?:  boolean
  payload?: Array<{ payload: ChartDatum }>
}) {
  if (!active || !payload?.length) return null
  const d   = payload[0].payload
  const cfg = CONFIG[d.desenlace]
  return (
    <div className="bg-white border border-divider rounded-lg px-3 py-2 shadow-sm">
      <p className="text-xs font-semibold text-ink">{cfg.label}</p>
      <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
        {d.total} crías · {d.porcentaje}%
      </p>
    </div>
  )
}

// ── Sección principal ─────────────────────────────────────────────────────────

export function SeccionSeguimientoCrias({
  desenlaces,
}: {
  desenlaces: DesenlacesCriasPeriodo
}) {
  const chartData: ChartDatum[] = desenlaces.desenlaces.map(d => ({
    desenlace:  d.desenlace,
    total:      d.total,
    porcentaje: d.porcentaje,
  }))

  return (
    <div className="px-6 pt-10 pb-6">

      {/* Cabecera */}
      <div className="flex items-baseline gap-3 mb-5">
        <h3 className="text-xl font-semibold text-world">
          Seguimiento de crías nacidas en este período
        </h3>
        <span className="text-xs text-ink-muted">
          {formatFecha(isoStringToDate(desenlaces.periodo.desde))}
          {' – '}
          {formatFecha(isoStringToDate(desenlaces.periodo.hasta))}
        </span>
      </div>

      {desenlaces.nacidasVivas === 0 ? (
        <p className="text-sm text-ink-muted py-6 text-center">
          No se produjo ningún parto en el período seleccionado.
        </p>
      ) : (
        <>
          {/* Total nacidas vivas */}
          <div className="mb-6">
            <p className="text-4xl font-extrabold text-world tracking-tight">
              {desenlaces.nacidasVivas}
            </p>
            <p className="text-sm text-ink-muted mt-1">crías nacidas vivas</p>
            {desenlaces.nacidasMuertas > 0 && (
              <p className="text-xs text-ink-muted/60 mt-0.5">
                + {desenlaces.nacidasMuertas} nacidas muertas no incluidas
              </p>
            )}
          </div>

          {/* Gráfico de barras */}
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              margin={{ top: 32, right: 8, left: 8, bottom: 0 }}
              barCategoryGap="35%"
            >
              <Bar dataKey="total" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {/* Valor numérico encima de cada barra */}
                <LabelList
                  dataKey="total"
                  position="top"
                  style={{ fontSize: '13px', fontWeight: '600', fill: '#111827' }}
                />
                {chartData.map(d => (
                  <Cell key={d.desenlace} fill={BAR_FILL[d.desenlace]} />
                ))}
              </Bar>
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Leyenda: color + nombre + % */}
          <div className="flex gap-3 mt-2 pt-4 border-t border-divider">
            {chartData.map(d => {
              const cfg = CONFIG[d.desenlace]
              return (
                <div key={d.desenlace} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ background: BAR_FILL[d.desenlace] }}
                  />
                  <div className="flex items-start gap-0.5 justify-center">
                    <p className="text-xs text-ink-muted text-center leading-snug">
                      {cfg.label}
                    </p>
                    {cfg.popover && <InfoPopover content={cfg.popover} />}
                  </div>
                  <p className="text-xs font-medium text-ink tabular-nums">
                    {d.porcentaje}%
                  </p>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
