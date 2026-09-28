'use client'

import { useRef, useState, useEffect } from 'react'
import type { ActividadReproductivaHistorica, MetricasReproductivas } from '../../domain/analytics'

const cria = 'bg-world/5'

// Gradiente separador: aparece con fade cuando hay contenido oculto a la izquierda.
// after:absolute requiere que la celda sticky establezca el containing block (lo hace por ser positioned).
const GRADIENT = [
  "after:content-['']",
  'after:absolute after:top-0 after:bottom-0 after:left-full',
  'after:w-4 after:bg-gradient-to-r after:from-black/[.07] after:to-transparent',
  'after:pointer-events-none after:transition-opacity after:duration-200',
].join(' ')

function FilaMetricas({
  label,
  m,
  bold,
  isScrolled,
}: {
  label:      string
  m:          MetricasReproductivas
  bold?:      boolean
  isScrolled: boolean
}) {
  const base    = bold
    ? 'font-semibold text-ink bg-surface-alt'
    : 'text-ink hover:bg-surface-row-hover group'
  const criaBg  = bold ? '' : cria
  // Fondo sólido obligatorio en sticky: nunca usar opacidad porque se mezcla con el contenido que pasa por debajo
  const stickyBg = bold
    ? 'bg-surface-alt'
    : 'bg-canvas group-hover:bg-surface-row-hover transition-colors'
  const stickyClass = [
    'px-4 py-2.5 whitespace-nowrap sticky left-0 z-10',
    stickyBg,
    GRADIENT,
    isScrolled ? 'after:opacity-100' : 'after:opacity-0',
  ].join(' ')

  return (
    <tr className={base}>
      <td className={stickyClass}>{label}</td>
      <td className="px-4 py-2.5 text-center tabular-nums relative z-0">{m.cubriciones    || '—'}</td>
      <td className="px-4 py-2.5 text-center tabular-nums relative z-0">{m.confirmaciones || '—'}</td>
      <td className="px-4 py-2.5 text-center tabular-nums relative z-0">{m.partos         || '—'}</td>
      <td className="px-4 py-2.5 text-center tabular-nums relative z-0">{m.abortos        || '—'}</td>
      <td className="px-4 py-2.5 text-center tabular-nums relative z-0">{m.machorras      || '—'}</td>
      <td className={`px-4 py-2.5 text-center tabular-nums relative z-0 ${criaBg}`}>{m.criasNacidas  || '—'}</td>
      <td className={`px-4 py-2.5 text-center tabular-nums relative z-0 ${criaBg}`}>{m.criasVivas    || '—'}</td>
      <td className={`px-4 py-2.5 text-center tabular-nums relative z-0 ${criaBg}`}>{m.criasMuertas  || '—'}</td>
    </tr>
  )
}

export function TablaActividadHistorica({
  actividad,
}: {
  actividad: ActividadReproductivaHistorica
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const check = () => setIsScrolled(el.scrollLeft > 0)
    check()  // estado inicial antes del primer scroll del usuario
    el.addEventListener('scroll', check, { passive: true })
    return () => el.removeEventListener('scroll', check)
  }, [])

  const thStickyClass = [
    'px-4 py-3 text-left font-medium whitespace-nowrap sticky left-0 z-20 bg-surface-alt',
    GRADIENT,
    isScrolled ? 'after:opacity-100' : 'after:opacity-0',
  ].join(' ')

  return (
    <div ref={scrollRef} className="rounded-lg border border-divider overflow-x-auto">
      <table className="w-full text-sm bg-canvas">
        <thead>
          <tr className="bg-surface-alt text-ink-muted text-xs uppercase tracking-wide border-b border-divider">
            <th className={thStickyClass}>Periodo</th>
            <th className="px-4 py-3 text-center font-medium whitespace-nowrap relative z-0">Cubr.</th>
            <th className="px-4 py-3 text-center font-medium whitespace-nowrap relative z-0">Conf. gest.</th>
            <th className="px-4 py-3 text-center font-medium whitespace-nowrap relative z-0">Partos</th>
            <th className="px-4 py-3 text-center font-medium whitespace-nowrap relative z-0">Abortos</th>
            <th className="px-4 py-3 text-center font-medium whitespace-nowrap relative z-0">Machorras</th>
            <th className="px-4 py-3 text-center font-medium whitespace-nowrap relative z-0">Total crías</th>
            <th className="px-4 py-3 text-center font-medium whitespace-nowrap relative z-0">Vivas</th>
            <th className="px-4 py-3 text-center font-medium whitespace-nowrap relative z-0">Muertas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-divider">
          {actividad.buckets.map(bucket => (
            <FilaMetricas
              key={bucket.desde}
              label={bucket.label}
              m={bucket.metricas}
              isScrolled={isScrolled}
            />
          ))}
        </tbody>
        <tfoot className="border-t-2 border-divider">
          <FilaMetricas label="Total" m={actividad.totales} bold isScrolled={isScrolled} />
        </tfoot>
      </table>
    </div>
  )
}
