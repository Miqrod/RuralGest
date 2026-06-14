import { FichaSection } from './FichaSection'
import { listarEventosDeAnimal } from '@/modules/ganadero/animales/application/queries/listarEventosDeAnimal'
import { formatFecha } from '@/lib/format'
import type { UUID } from '@/modules/shared/types'

// Etiqueta visible por tipo de evento. Se amplía cuando se añadan nuevos tipos.
const TIPO_LABEL: Record<string, string> = {
  ENTRADA:  'Entrada',
  SALIDA:   'Salida',
  SANITARIO:'Sanitario',
}

// Color del badge por tipo. Neutro como fallback para tipos futuros.
const TIPO_CLASS: Record<string, string> = {
  ENTRADA:  'bg-success-soft text-success',
  SALIDA:   'bg-alert-soft text-alert',
  SANITARIO:'bg-warning-soft text-warning',
}

export async function SeccionEventos({ animalId }: { animalId: UUID }) {
  const eventos = await listarEventosDeAnimal(animalId)

  return (
    <FichaSection title="Historial de eventos">
      {eventos.length === 0 ? (
        <p className="text-sm text-ink-muted">Sin eventos registrados.</p>
      ) : (
        <ol className="space-y-3">
          {eventos.map((evento) => {
            const badgeClass =
              TIPO_CLASS[evento.tipo_codigo] ?? 'bg-surface-alt text-ink-muted'
            const label =
              TIPO_LABEL[evento.tipo_codigo] ?? evento.tipo_label

            return (
              <li
                key={evento.id}
                className="flex items-center gap-3 text-sm"
              >
                {/* Tipo */}
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>
                  {label}
                </span>

                {/* Motivo */}
                {evento.motivo && (
                  <span className="text-ink-muted capitalize">{evento.motivo}</span>
                )}

                {/* Separador */}
                <span className="text-divider">·</span>

                {/* Fecha */}
                <span className="text-ink">{formatFecha(evento.fecha)}</span>

                {/* ID truncado — trazabilidad */}
                <span className="ml-auto font-mono text-xs text-ink-muted" title={evento.id}>
                  #{evento.id.slice(0, 8)}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </FichaSection>
  )
}
