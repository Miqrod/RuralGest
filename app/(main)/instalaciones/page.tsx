import { PageContainer } from '@/components/layout/PageContainer'
import { listarInstalaciones } from '@/modules/ganadero/instalaciones/application/queries/listarInstalaciones'
import { InstalacionesListado } from './InstalacionesListado'

export default async function InstalacionesPage() {
  const instalaciones = await listarInstalaciones()

  return (
    <PageContainer>
      {/* Título estático — fuera de la animación */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-world">Instalaciones</h1>
        <p className="text-sm text-ink-muted mt-1">
          Mapa y listado de las instalaciones de la explotación.
        </p>
      </div>

      <InstalacionesListado data={instalaciones} />
    </PageContainer>
  )
}
