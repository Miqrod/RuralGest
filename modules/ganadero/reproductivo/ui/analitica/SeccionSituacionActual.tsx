'use client'

import { Info } from 'lucide-react'
import { isoStringToDate, formatFecha } from '@/lib/format'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { EstadoReproductivoBadge } from '@/modules/ganadero/animales/ui/ficha/EstadosBadges'
import type { SituacionReproductivaActual } from '../../domain/analytics'

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

export function SeccionSituacionActual({
  situacion,
  revisionCount,
  umbralDias,
}: {
  situacion: SituacionReproductivaActual
  revisionCount: number
  umbralDias: number
}) {
  const revisionPct =
    situacion.totalReproductoras > 0
      ? Math.round((revisionCount / situacion.totalReproductoras) * 1000) / 10
      : 0

  return (
    <section
      className="rounded-2xl border border-world shadow-sm overflow-hidden p-6 card-bg-situacion"
    >
      {/* Cabecera */}
      <div className="flex items-baseline gap-3 mb-5">
        <h2 className="text-2xl font-bold text-world">Situación actual</h2>
        <span className="text-xs text-ink-muted">
          {formatFecha(isoStringToDate(situacion.fechaConsulta))}
        </span>
      </div>

      {/* Fila superior: total reproductoras (izq) + requieren revisión (der) */}
      <div className="grid grid-cols-2 gap-4 mb-4">

        <div>
          <p className="text-4xl font-extrabold text-world tracking-tight">
            {situacion.totalReproductoras}
          </p>
          <p className="text-sm text-ink-muted mt-1">Reproductoras activas</p>
        </div>

        <div className="text-right">
          <div className="flex items-baseline justify-end gap-2">
            <span className="text-sm text-ink-muted">{revisionPct}%</span>
            <p className="text-4xl font-extrabold text-warning tracking-tight">
              {revisionCount}
            </p>
          </div>
          <div className="flex items-center justify-end gap-1 mt-1">
            <InfoPopover
              content={`Estas vacas llevan más de ${umbralDias} días sin gestación declarada`}
            />
            <p className="text-sm text-ink-muted">requieren revisión</p>
          </div>
        </div>

      </div>

      {/* Fila inferior: distribución por estado */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-3">
        {situacion.distribucion.map((d) => (
          <div key={d.estado} className="rounded-xl border border-divider bg-white/60 p-4">
            <div className="flex items-center gap-3 min-[480px]:block">
              <p className="text-2xl font-extrabold text-ink tracking-tight shrink-0">{d.total}</p>
              <p className="text-xs text-ink-muted dark:text-white min-[480px]:mt-0.5 min-[480px]:mb-2">{d.porcentaje}%</p>
              <EstadoReproductivoBadge estado={d.estado} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
