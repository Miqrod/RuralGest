'use client'

import { motion } from 'framer-motion'
import type { EventoEnHistorial } from '@/modules/ganadero/animales/application/queries/listarEventosDeAnimal'
import { formatFecha } from '@/lib/format'

// Badge: etiqueta de categoría visible en el historial.
// Movimientos usan su propio nombre (Entrada/Salida); reproductivos comparten "Reproductivo".
const BADGE_LABEL: Record<string, string> = {
  ENTRADA:                   'Entrada',
  SALIDA:                    'Salida',
  SANITARIO:                 'Sanitario',
  CUBRICION:                 'Reproductivo',
  CONFIRMACION_GESTACION:    'Reproductivo',
  PARTO:                     'Reproductivo',
  DESTETE:                   'Reproductivo',
  ABORTO:                    'Reproductivo',
  CAMBIO_TIPO_PRODUCTIVO:    'Gestión',
}

// Color del badge por categoría (todos los reproductivos comparten el azul).
const BADGE_CLASS: Record<string, string> = {
  ENTRADA:                   'bg-success-soft text-success',
  SALIDA:                    'bg-alert-soft text-alert',
  SANITARIO:                 'bg-warning-soft text-warning',
  CUBRICION:                 'bg-blue-50 text-blue-600',
  CONFIRMACION_GESTACION:    'bg-blue-50 text-blue-600',
  PARTO:                     'bg-blue-50 text-blue-600',
  DESTETE:                   'bg-blue-50 text-blue-600',
  ABORTO:                    'bg-blue-50 text-blue-600',
  CAMBIO_TIPO_PRODUCTIVO:    'bg-surface-alt text-ink-muted',
}

// Descripción específica del evento (complementa al badge de categoría).
// Para movimientos (ENTRADA/SALIDA) la descripción viene del campo motivo.
// CAMBIO_TIPO_PRODUCTIVO: la descripción se compone en el renderer usando metadata_json.
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

export function EventosList({ eventos }: { eventos: EventoEnHistorial[] }) {
  return (
    <motion.ol
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {eventos.map((evento) => {
        // Entrada virtual: opacidad reducida e itálica para diferenciarse de hechos reales.
        // Layout: Badge → fecha → CX pill → descripción
        if (evento.virtual) {
          return (
            <motion.li key={evento.id} variants={item} className="flex items-center gap-3 text-sm opacity-55">
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-600">
                Reproductivo
              </span>
              <span className="text-xs text-ink-muted/60">{formatFecha(evento.fecha)}</span>
              <span
                title={`Ciclo reproductivo ${evento.ciclo_numero}`}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-surface-alt text-ink-muted cursor-default"
              >
                C{evento.ciclo_numero}
              </span>
              <span className="text-ink-muted italic">Nuevo ciclo · Vacía</span>
            </motion.li>
          )
        }

        const badgeClass  = BADGE_CLASS[evento.tipo_codigo]  ?? 'bg-surface-alt text-ink-muted'
        const badgeLabel  = BADGE_LABEL[evento.tipo_codigo]  ?? evento.tipo_label
        // Descripción del evento: varía según el código
        const descripcion = evento.tipo_codigo === 'PARTO' && evento.rol === 'cria'
          ? 'Nacimiento'
          : evento.tipo_codigo === 'CAMBIO_TIPO_PRODUCTIVO'
            ? `Cambio productivo: ${String(evento.metadata_json?.tipo_nuevo ?? '—')}`
            : EVENTO_DESCRIPCION[evento.tipo_codigo] ?? evento.motivo

        // Etiqueta de ciclo solo para eventos reproductivos: C1, C2…
        const cicloLabel = evento.ciclo_numero !== null ? `C${evento.ciclo_numero}` : null

        // Para DESTETE cuando este animal es la madre: mostrar crías destetadas con ♂/♀
        const criasLabel = evento.tipo_codigo === 'DESTETE' && evento.rol === 'madre' && evento.crias_destetadas.length > 0
          ? evento.crias_destetadas.map(c => {
              const sexo  = c.sexo ? (SEXO_SYMBOL[c.sexo] ?? null) : null
              const base  = c.crotal ?? c.nombre ?? 'sin crotal'
              return sexo ? `${sexo} - ${base}` : base
            }).join(', ')
          : null

        // Layout: Badge → fecha → [CX pill si reproductivo] → descripción → [crías] → hash
        return (
          <motion.li key={evento.id} variants={item} className="flex items-center gap-3 text-sm">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>
              {badgeLabel}
            </span>
            <span className="text-xs text-ink-muted/60">{formatFecha(evento.fecha)}</span>
            {cicloLabel && (
              <span
                title={`Ciclo reproductivo ${evento.ciclo_numero}`}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-surface-alt text-ink-muted cursor-default"
              >
                {cicloLabel}
              </span>
            )}
            {descripcion && (
              <span className="text-ink-muted capitalize">{descripcion}</span>
            )}
            {criasLabel && (
              <span className="text-ink-muted">{criasLabel}</span>
            )}
            <span className="ml-auto font-mono text-xs text-ink-muted" title={evento.id}>
              #{evento.id.slice(0, 8)}
            </span>
          </motion.li>
        )
      })}
    </motion.ol>
  )
}
