'use client'

import { motion } from 'framer-motion'
import type { EventoDeAnimal } from '@/modules/ganadero/animales/application/queries/listarEventosDeAnimal'
import { formatFecha } from '@/lib/format'

const TIPO_LABEL: Record<string, string> = {
  ENTRADA:   'Entrada',
  SALIDA:    'Salida',
  SANITARIO: 'Sanitario',
}

const TIPO_CLASS: Record<string, string> = {
  ENTRADA:   'bg-success-soft text-success',
  SALIDA:    'bg-alert-soft text-alert',
  SANITARIO: 'bg-warning-soft text-warning',
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const item = {
  hidden: { opacity: 0, x: -6 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.2 } },
}

export function EventosList({ eventos }: { eventos: EventoDeAnimal[] }) {
  return (
    <motion.ol
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {eventos.map((evento) => {
        const badgeClass = TIPO_CLASS[evento.tipo_codigo] ?? 'bg-surface-alt text-ink-muted'
        const label      = TIPO_LABEL[evento.tipo_codigo] ?? evento.tipo_label

        return (
          <motion.li key={evento.id} variants={item} className="flex items-center gap-3 text-sm">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>
              {label}
            </span>
            {evento.motivo && (
              <span className="text-ink-muted capitalize">{evento.motivo}</span>
            )}
            <span className="text-divider">·</span>
            <span className="text-ink">{formatFecha(evento.fecha)}</span>
            <span className="ml-auto font-mono text-xs text-ink-muted" title={evento.id}>
              #{evento.id.slice(0, 8)}
            </span>
          </motion.li>
        )
      })}
    </motion.ol>
  )
}
