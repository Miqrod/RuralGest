import { PageContainer } from '@/components/layout/PageContainer'
import { listarAnimalesParaReubicar } from '@/modules/ganadero/instalaciones/application/queries/listarAnimalesParaReubicar'
import { listarDestinosReubicacion } from '@/modules/ganadero/instalaciones/application/queries/listarDestinosReubicacion'
import { ReubicacionesGlobal } from './ReubicacionesGlobal'

export default async function ReubicarAnimalesPage() {
  const [animales, destinos] = await Promise.all([
    listarAnimalesParaReubicar(),
    listarDestinosReubicacion(),
  ])

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-world">Reubicar animales</h1>
        <p className="text-sm text-ink-muted mt-1">
          Selecciona uno o varios animales y asígnales una nueva instalación.
        </p>
      </div>

      <div className="bg-canvas rounded-xl shadow-sm border border-divider/30 overflow-hidden p-5">
        <ReubicacionesGlobal animales={animales} destinos={destinos} />
      </div>
    </PageContainer>
  )
}
