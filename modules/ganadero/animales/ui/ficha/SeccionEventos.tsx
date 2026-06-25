import { FichaSection } from './FichaSection'
import { EventosList } from './EventosList'
import { listarEventosDeAnimal } from '@/modules/ganadero/animales/application/queries/listarEventosDeAnimal'
import type { UUID } from '@/modules/shared/types'

export async function SeccionEventos({ animalId }: { animalId: UUID }) {
  const eventos = await listarEventosDeAnimal(animalId)

  return (
    <FichaSection title="Historial de eventos">
      {eventos.length === 0 ? (
        <p className="text-sm text-ink-muted">Sin eventos registrados.</p>
      ) : (
        <EventosList eventos={eventos} />
      )}
    </FichaSection>
  )
}
