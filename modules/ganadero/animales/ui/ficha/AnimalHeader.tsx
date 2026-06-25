'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EstadoVitalBadge } from './EstadosBadges'
import type { AnimalDetail } from '@/modules/ganadero/animales/application/queries/getAnimalDetail'

const SEXO_LABEL: Record<string, string> = {
  macho:  'Macho',
  hembra: 'Hembra',
}

const pill = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-surface-alt text-ink-muted'

export function AnimalHeader({ animal }: { animal: AnimalDetail }) {
  // Identificador principal: crotal > num_hierro > sin identificador
  const identificador = animal.crotal ?? animal.num_hierro

  // Subtítulo: num_hierro solo cuando hay crotal (para no repetir el identificador)
  const subtitulo = animal.crotal && animal.num_hierro
    ? `Hierro: ${animal.num_hierro}`
    : null

  return (
    <div
      className="rounded-lg border border-world shadow-sm p-5"
      style={{ backgroundColor: 'var(--world-accent-soft)' }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className={cn(
            'text-2xl font-bold',
            identificador ? 'text-world' : 'text-ink-muted italic'
          )}>
            {identificador ?? 'Sin crotal'}
          </h1>
          {subtitulo && (
            <p className="text-sm text-ink-muted mt-0.5">{subtitulo}</p>
          )}
        </div>

        {/* Crossfade al cambiar de estado vital tras registrar una salida */}
        <AnimatePresence mode="wait">
          <motion.div
            key={animal.estado_vital}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <EstadoVitalBadge
              estado={animal.estado_vital}
              className="text-sm px-3 py-1 mt-1"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <span className={pill}>{SEXO_LABEL[animal.sexo] ?? animal.sexo}</span>
        {animal.tipo_productivo_nombre && (
          <span className={pill}>{animal.tipo_productivo_nombre}</span>
        )}
        {animal.raza_nombre && (
          <span className={pill}>{animal.raza_nombre}</span>
        )}
      </div>
    </div>
  )
}
