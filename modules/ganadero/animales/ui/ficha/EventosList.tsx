'use client'

import { motion } from 'framer-motion'
import type { EventoDeAnimal } from '@/modules/ganadero/animales/application/queries/listarEventosDeAnimal'
import { formatFecha } from '@/lib/format'

// Badge: etiqueta de categoría visible en el historial.
// Movimientos usan su propio nombre (Entrada/Salida); reproductivos comparten "Reproductivo".
const BADGE_LABEL: Record<string, string> = {
  ENTRADA:                'Entrada',
  SALIDA:                 'Salida',
  SANITARIO:              'Sanitario',
  CUBRICION:              'Reproductivo',
  CONFIRMACION_GESTACION: 'Reproductivo',
  PARTO:                  'Reproductivo',
  DESTETE:                'Reproductivo',
  ABORTO:                 'Reproductivo',
}

// Color del badge por categoría (todos los reproductivos comparten el azul).
const BADGE_CLASS: Record<string, string> = {
  ENTRADA:                'bg-success-soft text-success',
  SALIDA:                 'bg-alert-soft text-alert',
  SANITARIO:              'bg-warning-soft text-warning',
  CUBRICION:              'bg-blue-50 text-blue-600',
  CONFIRMACION_GESTACION: 'bg-blue-50 text-blue-600',
  PARTO:                  'bg-blue-50 text-blue-600',
  DESTETE:                'bg-blue-50 text-blue-600',
  ABORTO:                 'bg-blue-50 text-blue-600',
}

// Descripción específica del evento (complementa al badge de categoría).
// Para movimientos (ENTRADA/SALIDA) la descripción viene del campo motivo.
const EVENTO_DESCRIPCION: Record<string, string> = {
  CUBRICION:              'Cubrición',
  CONFIRMACION_GESTACION: 'Confirmación gestación',
  PARTO:                  'Parto',
  DESTETE:                'Destete',
  ABORTO:                 'Aborto',
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const item = {
  hidden: { opacity: 0, x: -6 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.2 } },
}

const SEXO_SYMBOL: Record<string, string> = { macho: '♂', hembra: '♀' }

export function EventosList({ eventos }: { eventos: EventoDeAnimal[] }) {
  return (
    <motion.ol
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {eventos.map((evento) => {
        const badgeClass  = BADGE_CLASS[evento.tipo_codigo]  ?? 'bg-surface-alt text-ink-muted'
        const badgeLabel  = BADGE_LABEL[evento.tipo_codigo]  ?? evento.tipo_label
        // Para PARTO: la madre ve "Parto", la cría ve "Nacimiento"
        const descripcion = evento.tipo_codigo === 'PARTO' && evento.rol === 'cria'
          ? 'Nacimiento'
          : EVENTO_DESCRIPCION[evento.tipo_codigo] ?? evento.motivo

        // Para DESTETE cuando este animal es la madre: mostrar crías destetadas con ♂/♀
        const criasLabel = evento.tipo_codigo === 'DESTETE' && evento.rol === 'madre' && evento.crias_destetadas.length > 0
          ? evento.crias_destetadas.map(c => {
              const sexo  = c.sexo ? (SEXO_SYMBOL[c.sexo] ?? null) : null
              const base  = c.crotal ?? c.nombre ?? 'sin crotal'
              return sexo ? `${sexo} - ${base}` : base
            }).join(', ')
          : null

        return (
          <motion.li key={evento.id} variants={item} className="flex items-center gap-3 text-sm">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>
              {badgeLabel}
            </span>
            {descripcion && (
              <span className="text-ink-muted capitalize">{descripcion}</span>
            )}
            {criasLabel && (
              <span className="text-ink-muted">{criasLabel}</span>
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
