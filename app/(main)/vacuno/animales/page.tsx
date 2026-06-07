import { PageContainer } from '@/components/layout/PageContainer'
import { listarAnimales } from '@/modules/ganadero/animales/application/queries/listarAnimales'
import { AnimalesTable } from './AnimalesTable'

export default async function AnimalesPage() {
  const animales = await listarAnimales()

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-world">Animales</h1>
        <p className="text-sm text-ink-muted mt-1">{animales.length} animales en el sistema</p>
      </div>

      <AnimalesTable data={animales} />
    </PageContainer>
  )
}
