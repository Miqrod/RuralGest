import type { ActividadReproductivaHistorica, PeriodoAnalisis } from '../../domain/analytics'
import { SelectorPeriodoNav } from './SelectorPeriodoNav'
import { TablaActividadHistorica } from './TablaActividadHistorica'

export function SeccionActividadHistorica({
  actividad,
  periodo,
}: {
  actividad: ActividadReproductivaHistorica
  periodo:   PeriodoAnalisis
}) {
  const sinDatos = actividad.buckets.every(
    (b) =>
      b.metricas.cubriciones === 0 &&
      b.metricas.partos      === 0 &&
      b.metricas.abortos     === 0 &&
      b.metricas.machorras   === 0,
  )

  return (
    <section>
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-2xl font-bold text-world mb-4">Actividad reproductiva</h2>
        <SelectorPeriodoNav value={periodo} />
      </div>

      {sinDatos ? (
        <p className="text-sm text-ink-muted py-6 text-center px-6 pb-6">
          Sin actividad registrada en el período seleccionado.
        </p>
      ) : (
        <div className="px-6 pb-6">
          <TablaActividadHistorica actividad={actividad} />
        </div>
      )}
    </section>
  )
}
