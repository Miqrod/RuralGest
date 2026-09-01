import { FichaSection } from '@/modules/ganadero/animales/ui/ficha/FichaSection'
import { getHistorialReproductivo } from '../application/queries/getHistorialReproductivo'
import { HistorialCarousel } from './HistorialCarousel'
import type { UUID, ISODate } from '@/modules/shared/types'
import type { EstadoVital } from '@/modules/ganadero/shared/domain/types'

interface Props {
  animalId:           UUID
  animalNombre?:      string | null
  madreCrotal:        string | null
  fechaPrevistaParto: ISODate | null
  // Necesarios para la anotación contextual en animales vendidos/fallecidos
  estadoVital:        EstadoVital
  fechaSalida:        ISODate | null
  canMachorra:        boolean
}

// Solo se renderiza cuando el animal tiene historial reproductivo.
// La página es responsable de condicionar la renderización.
export async function SeccionHistorialReproductivo({
  animalId,
  animalNombre,
  madreCrotal,
  fechaPrevistaParto,
  estadoVital,
  fechaSalida,
  canMachorra,
}: Props) {
  const ciclos = await getHistorialReproductivo(animalId)

  return (
    <FichaSection title="Historial reproductivo">
      {ciclos.length === 0 ? (
        <p className="text-sm text-ink-muted">Sin ciclos reproductivos registrados.</p>
      ) : (
        <HistorialCarousel
          ciclos={ciclos}
          animalId={animalId}
          animalNombre={animalNombre}
          madreCrotal={madreCrotal}
          fechaPrevistaParto={fechaPrevistaParto}
          estadoVital={estadoVital}
          fechaSalida={fechaSalida}
          canMachorra={canMachorra}
        />
      )}
    </FichaSection>
  )
}
