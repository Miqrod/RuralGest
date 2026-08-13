import { FichaSection } from '@/modules/ganadero/animales/ui/ficha/FichaSection'
import { getHistorialReproductivo } from '../application/queries/getHistorialReproductivo'
import { HistorialCarousel } from './HistorialCarousel'
import type { UUID, ISODate } from '@/modules/shared/types'

interface Props {
  animalId: UUID
  madreCrotal: string | null
  fechaPrevistaParto: ISODate | null
}

// Solo se renderiza para hembras reproductoras: la página es responsable de condicionar.
export async function SeccionHistorialReproductivo({ animalId, madreCrotal, fechaPrevistaParto }: Props) {
  const ciclos = await getHistorialReproductivo(animalId)

  return (
    <FichaSection title="Historial reproductivo">
      {ciclos.length === 0 ? (
        <p className="text-sm text-ink-muted">Sin ciclos reproductivos registrados.</p>
      ) : (
        <HistorialCarousel ciclos={ciclos} madreCrotal={madreCrotal} fechaPrevistaParto={fechaPrevistaParto} />
      )}
    </FichaSection>
  )
}
