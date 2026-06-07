import type { ReactNode } from 'react'
import { FichaSection } from './FichaSection'
import { EstadoVitalBadge, EstadoReproductivoBadge, EstadoSanitarioBadge } from './EstadosBadges'
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
  return (
    <FichaSection title="Estados">
      <FilaEstado label="Vital">
        <EstadoVitalBadge estado={animal.estado_vital} />
      </FilaEstado>

      {animal.es_reproductora && (
        <FilaEstado label="Reproductivo">
          <EstadoReproductivoBadge estado={animal.estado_reproductivo} />
        </FilaEstado>
      )}

      <FilaEstado label="Sanitario">
        <EstadoSanitarioBadge estado={animal.estado_sanitario} />
      </FilaEstado>
    </FichaSection>
  )
}
