import type { ReactNode } from 'react'
import { differenceInDays } from 'date-fns'
import { FichaSection } from './FichaSection'
import { EstadoVitalBadge, EstadoReproductivoBadge, EstadoSanitarioBadge } from './EstadosBadges'
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

export function SeccionEstados({ animal }: { animal: AnimalDetail }) {
  const diasRestantes = animal.fecha_prevista_parto
    ? differenceInDays(new Date(animal.fecha_prevista_parto), new Date())
    : null

  return (
    <FichaSection title="Estados">
      <FilaEstado label="Vital">
        <EstadoVitalBadge estado={animal.estado_vital} />
      </FilaEstado>

      {animal.estado_reproductivo !== null && (
        <FilaEstado label="Reproductivo">
          <EstadoReproductivoBadge estado={animal.estado_reproductivo} />
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
