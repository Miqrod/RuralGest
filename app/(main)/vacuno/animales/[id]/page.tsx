import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PageContainer } from '@/components/layout/PageContainer'
import { getAnimalDetail } from '@/modules/ganadero/animales/application/queries/getAnimalDetail'
import { FichaAnimal } from '@/modules/ganadero/animales/ui/ficha/FichaAnimal'
import { SeccionEventos } from '@/modules/ganadero/animales/ui/ficha/SeccionEventos'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AnimalDetailPage({ params }: Props) {
  const { id } = await params
  const animal = await getAnimalDetail(id)

  if (!animal) notFound()

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
        <FichaAnimal animal={animal} />
        <SeccionEventos animalId={animal.id} />
      </div>
    </PageContainer>
  )
}
