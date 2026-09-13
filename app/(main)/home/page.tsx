import { PageContainer } from '@/components/layout/PageContainer'
import { getCensoVacunoVivo } from '@/modules/ganadero/animales/application/queries/getCensoVivo'
import { getAnimalesPendientesIdentificacion } from '@/modules/ganadero/animales/application/queries/getAnimalesPendientesIdentificacion'
import { getAnimalesSinUbicacion } from '@/modules/ganadero/instalaciones/application/queries/getAnimalesSinUbicacion'
import { listarDestinosReubicacion } from '@/modules/ganadero/instalaciones/application/queries/listarDestinosReubicacion'
import { KPIBannerVacuno } from '@/modules/ganadero/animales/ui/dashboard/KPIBannerVacuno'
import { WidgetPendientesIdentificacion } from '@/modules/ganadero/animales/ui/dashboard/WidgetPendientesIdentificacion'
import { WidgetPendientesUbicacion } from '@/modules/ganadero/instalaciones/ui/dashboard/WidgetPendientesUbicacion'

export default async function HomePage() {
  const [censo, { animales: pendientesId, total: totalId }, { animales: sinUbicacion, total: totalUbicacion }, destinos] = await Promise.all([
    getCensoVacunoVivo(),
    getAnimalesPendientesIdentificacion('vacuno', 20),
    getAnimalesSinUbicacion(),
    listarDestinosReubicacion(),
  ])

  return (
    <PageContainer>

      {/* Título */}
      <h1 className="text-3xl font-extrabold tracking-tight text-world mb-6">
        Estado de la explotación
      </h1>

      {/* KPI Banner — data-world activa el gradiente granate del mundo vacuno */}
      <div className="mb-6" data-world="vacuno">
        <KPIBannerVacuno censo={censo} />
      </div>

      {/* Widgets — 4 columnas en lg, 2 en md, 1 en mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="md:col-span-1 lg:col-span-2">
          <WidgetPendientesIdentificacion animales={pendientesId} total={totalId} />
        </div>
        <div className="md:col-span-1 lg:col-span-2">
          <WidgetPendientesUbicacion animales={sinUbicacion} total={totalUbicacion} destinos={destinos} />
        </div>
      </div>

    </PageContainer>
  )
}
