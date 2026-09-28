import { calcularPeriodo } from '@/modules/ganadero/reproductivo/domain/periodo'
import { getCurrentReproductiveSituation } from '@/modules/ganadero/reproductivo/application/queries/getCurrentReproductiveSituation'
import { getHistoricalReproductiveActivity } from '@/modules/ganadero/reproductivo/application/queries/getHistoricalReproductiveActivity'
import { getDesenlacesCriasPeriodo } from '@/modules/ganadero/reproductivo/application/queries/getDesenlacesCriasPeriodo'
import { getRevisionReproductiva } from '@/modules/ganadero/reproductivo/application/queries/getRevisionReproductiva'
import { SeccionSituacionActual } from '@/modules/ganadero/reproductivo/ui/analitica/SeccionSituacionActual'
import { SeccionActividadHistorica } from '@/modules/ganadero/reproductivo/ui/analitica/SeccionActividadHistorica'
import { SeccionSeguimientoCrias } from '@/modules/ganadero/reproductivo/ui/analitica/SeccionSeguimientoCrias'
import type { PresetPeriodo, PeriodoAnalisis } from '@/modules/ganadero/reproductivo/domain/analytics'

export default async function AnaliticaReproduccionPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string; preset?: string }>
}) {
  const params = await searchParams

  const periodo: PeriodoAnalisis =
    params.desde && params.hasta
      ? {
          desde: params.desde,
          hasta: params.hasta,
          preset: (params.preset as PresetPeriodo) ?? 'personalizado',
        }
      : calcularPeriodo('ultimo_trimestre')

  const [situacion, actividad, crias, revision] = await Promise.all([
    getCurrentReproductiveSituation('vacuno'),
    getHistoricalReproductiveActivity('vacuno', periodo),
    getDesenlacesCriasPeriodo('vacuno', periodo),
    getRevisionReproductiva(),
  ])

  return (
    <div className="space-y-8">
      <SeccionSituacionActual
        situacion={situacion}
        revisionCount={revision.animales.length}
        umbralDias={revision.umbralDias}
      />
      {/* Tarjeta compartida: ambas secciones responden al mismo selector de periodo */}
      <div
        className="rounded-2xl border border-divider shadow-sm card-bg-actividad"
      >
        <SeccionActividadHistorica actividad={actividad} periodo={periodo} />
        <SeccionSeguimientoCrias desenlaces={crias} />
      </div>
    </div>
  )
}
