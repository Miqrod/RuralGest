import { PageContainer } from '@/components/layout/PageContainer'
import { getCensoVacunoVivo } from '@/modules/ganadero/animales/application/queries/getCensoVivo'
import { getAnimalesPendientesIdentificacion } from '@/modules/ganadero/animales/application/queries/getAnimalesPendientesIdentificacion'
import { KPIBannerVacuno } from '@/modules/ganadero/animales/ui/dashboard/KPIBannerVacuno'
import { WidgetPendientesIdentificacion } from '@/modules/ganadero/animales/ui/dashboard/WidgetPendientesIdentificacion'

export default async function HomePage() {
  const [censo, { animales, total }] = await Promise.all([
    getCensoVacunoVivo(),
    getAnimalesPendientesIdentificacion('vacuno', 20),
  ])

  return (
    <PageContainer>

      {/* Título */}
      <h1 className="text-3xl font-extrabold tracking-tight text-world mb-6">
        Estado de la explotación
      </h1>

      {/* KPI Banner */}
      <div className="mb-6">
        <KPIBannerVacuno censo={censo} />
      </div>

      {/* Widgets — grid 2 columnas; añadir siguiente widget en la segunda celda */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WidgetPendientesIdentificacion animales={animales} total={total} />
      </div>

    </PageContainer>
  )
}
