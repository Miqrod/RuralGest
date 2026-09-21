'use client'

import type { ReactNode } from 'react'
import { differenceInDays } from 'date-fns'
import { Info } from 'lucide-react'
import { FichaSection } from './FichaSection'
import { EstadoVitalBadge, EstadoReproductivoBadge, EstadoSanitarioBadge } from './EstadosBadges'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatFecha } from '@/lib/format'
import type { AnimalDetail } from '@/modules/ganadero/animales/application/queries/getAnimalDetail'

function FilaEstado({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-divider last:border-0">
      <span className="text-sm text-ink-muted">{label}</span>
      {children}
    </div>
  )
}

const ESTADO_REPRODUCTIVO_LABEL: Record<string, string> = {
  vacia:    'Vacía',
  cubierta: 'Cubierta',
  gestante: 'Gestante',
}

// Badge derivado — no es un estado del ciclo reproductivo, sino un indicador de que
// la hembra tiene crías que aún maman. Se muestra junto al badge de estado reproductivo.
function LactanteBadge({ numCrias, estadoReproductivo }: { numCrias: number; estadoReproductivo: string }) {
  const label = ESTADO_REPRODUCTIVO_LABEL[estadoReproductivo] ?? estadoReproductivo
  const mensaje = `El estado reproductivo real es "${label}". Este aviso desaparecerá cuando se desteten todas las crías.`

  return (
    <Popover>
      <PopoverTrigger className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors cursor-pointer">
        Lactante
        <Info className="h-3 w-3 opacity-70" />
      </PopoverTrigger>
      <PopoverContent side="top" sideOffset={6} align="end" className="w-64 p-3">
        <p className="text-xs text-ink-muted leading-relaxed">{mensaje}</p>
      </PopoverContent>
    </Popover>
  )
}

interface Props {
  animal: AnimalDetail
  // Número de crías con vínculo materno activo — cuando > 0 y la madre tiene
  // estado reproductivo, se muestra el badge derivado "Lactante".
  numCriasActivas?: number
}

export function SeccionEstados({ animal, numCriasActivas = 0 }: Props) {
  const diasRestantes = animal.fecha_prevista_parto
    ? differenceInDays(new Date(animal.fecha_prevista_parto), new Date())
    : null

  const esLactante = numCriasActivas > 0 && animal.estado_reproductivo !== null

  return (
    <FichaSection title="Estados">
      <FilaEstado label="Vital">
        <EstadoVitalBadge estado={animal.estado_vital} />
      </FilaEstado>

      {animal.estado_reproductivo !== null && (
        <FilaEstado label="Reproductivo">
          <div className="flex items-center gap-2">
            <EstadoReproductivoBadge estado={animal.estado_reproductivo} />
            {esLactante && <LactanteBadge numCrias={numCriasActivas} estadoReproductivo={animal.estado_reproductivo!} />}
          </div>
        </FilaEstado>
      )}

      {animal.fecha_prevista_parto && (
        <FilaEstado label="Parto previsto">
          <span className="text-sm text-ink">
            {formatFecha(animal.fecha_prevista_parto)}
            {diasRestantes !== null && (
              <span className="ml-2 text-ink-muted">
                ({diasRestantes > 0 ? `en ${diasRestantes} días` : diasRestantes === 0 ? 'hoy' : `hace ${Math.abs(diasRestantes)} días`})
              </span>
            )}
          </span>
        </FilaEstado>
      )}

      <FilaEstado label="Sanitario">
        <EstadoSanitarioBadge estado={animal.estado_sanitario} />
      </FilaEstado>
    </FichaSection>
  )
}
