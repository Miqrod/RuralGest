import Link from 'next/link'
import { Tag, ChevronRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatFecha } from '@/lib/format'
import type { AnimalPendienteIdentificacion } from '../../application/queries/getAnimalesPendientesIdentificacion'

interface Props {
  animales: AnimalPendienteIdentificacion[]
  total: number
}

export function WidgetPendientesIdentificacion({ animales, total }: Props) {
  return (
    <div className="bg-canvas rounded-2xl p-8 shadow-sm border border-divider">

      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-extrabold tracking-tight text-ink">
            Pendientes de identificar
          </h3>
          {total > 0 && (
            <span className="text-xs font-bold bg-warning-soft text-warning px-2.5 py-1 rounded-full">
              {total}
            </span>
          )}
        </div>
        {total > animales.length && (
          <Link
            href="/vacuno/animales"
            className="text-world text-xs font-bold hover:underline flex items-center gap-1"
          >
            Ver todos
            <ChevronRight className="size-3" />
          </Link>
        )}
      </div>

      {/* Estado vacío */}
      {animales.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2 className="size-10 text-success mb-3" />
          <p className="text-sm font-semibold text-ink">Todos los animales están identificados</p>
          <p className="text-xs text-ink-muted mt-1">No hay pendientes en este momento</p>
        </div>
      )}

      {/* Lista */}
      {animales.length > 0 && (
        <div className="space-y-2">
          {animales.map(a => (
            <Link
              key={a.id}
              href={a.madre_id ? `/vacuno/animales/${a.madre_id}` : `/vacuno/animales/${a.id}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-surface-alt border border-transparent hover:border-warning/30 hover:bg-warning-soft/50 transition-all group cursor-pointer"
            >
              {/* Icono */}
              <div className="w-10 h-10 rounded-full bg-warning-soft flex items-center justify-center shrink-0">
                <Tag className="size-4 text-warning" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink group-hover:text-world transition-colors truncate">
                  {a.crotal ?? 'Sin crotal'}
                  {a.nombre && (
                    <span className="font-normal text-ink-muted ml-1.5">· {a.nombre}</span>
                  )}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {[
                    a.raza_nombre,
                    a.sexo === 'macho' ? 'Macho' : a.sexo === 'hembra' ? 'Hembra' : null,
                    a.madre_crotal ? `Madre: ${a.madre_crotal}` : null,
                    a.fecha_nacimiento ? formatFecha(a.fecha_nacimiento) : null,
                  ].filter(Boolean).join(' · ')}
                </p>
              </div>

              <ChevronRight className="size-4 text-ink-muted/40 group-hover:text-world transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
