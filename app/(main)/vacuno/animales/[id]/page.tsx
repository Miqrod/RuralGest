import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PageContainer } from '@/components/layout/PageContainer'
import { getAnimalDetail } from '@/modules/ganadero/animales/application/queries/getAnimalDetail'
import { getMachosDisponibles } from '@/modules/ganadero/animales/application/queries/getMachosDisponibles'
import { AnimalHeader } from '@/modules/ganadero/animales/ui/ficha/AnimalHeader'
import { SeccionEstados } from '@/modules/ganadero/animales/ui/ficha/SeccionEstados'
import { SeccionOrigen } from '@/modules/ganadero/animales/ui/ficha/SeccionOrigen'
import { SeccionAcciones } from '@/modules/ganadero/animales/ui/ficha/SeccionAcciones'
import { SeccionEventos } from '@/modules/ganadero/animales/ui/ficha/SeccionEventos'
import { SeccionHistorialReproductivo } from '@/modules/ganadero/reproductivo/ui/SeccionHistorialReproductivo'
import { getCicloAbierto } from '@/modules/ganadero/reproductivo/infrastructure/repository'
import { getCriasParaDestete } from '@/modules/ganadero/reproductivo/application/queries/getCriasParaDestete'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AnimalDetailPage({ params }: Props) {
  const { id } = await params
  const animal = await getAnimalDetail(id)

  if (!animal) notFound()

  // Solo necesario para hembras reproductoras; en el resto el panel no mostrará los botones.
  const [machos, cicloAbierto, criasElegibles] = await Promise.all([
    animal.es_reproductora ? getMachosDisponibles(animal.especie) : Promise.resolve([]),
    animal.es_reproductora &&
    (animal.estado_reproductivo === 'gestante' || animal.estado_reproductivo === 'cubierta')
      ? getCicloAbierto(animal.id)
      : Promise.resolve(null),
    // Crías elegibles para destete: solo cuando la madre está lactante
    animal.es_reproductora && animal.estado_reproductivo === 'lactante'
      ? getCriasParaDestete(animal.id)
      : Promise.resolve([]),
  ])

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-world">Ficha detalle animal</h1>
        <Link
          href="/vacuno/animales"
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors"
        >
          ← Volver a animales
        </Link>
      </div>
      <div className="flex flex-col gap-4">
        <AnimalHeader animal={animal} />
        <SeccionAcciones
          animalId={animal.id}
          crotal={animal.crotal}
          nombre={animal.nombre}
          estadoVital={animal.estado_vital}
          esReproductora={animal.es_reproductora}
          estadoReproductivo={animal.estado_reproductivo}
          tieneCicloAbierto={cicloAbierto !== null}
          machos={machos}
          criasElegibles={criasElegibles}
        />
        {animal.es_reproductora ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SeccionHistorialReproductivo
          animalId={animal.id}
          madreCrotal={animal.crotal}
          fechaPrevistaParto={animal.fecha_prevista_parto}
        />
            <SeccionEstados animal={animal} />
            <SeccionOrigen animal={animal} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SeccionEstados animal={animal} />
            <SeccionOrigen animal={animal} />
          </div>
        )}
        <SeccionEventos animalId={animal.id} />
      </div>
    </PageContainer>
  )
}
