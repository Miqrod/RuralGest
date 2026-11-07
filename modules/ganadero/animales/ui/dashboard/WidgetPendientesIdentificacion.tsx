'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Tag, ChevronRight, CheckCircle2, ArrowUpRight } from 'lucide-react'
import { formatFecha } from '@/lib/format'
import { DrawerIdentificacion } from '@/modules/ganadero/animales/ui/identificacion/DrawerIdentificacion'
import type { AnimalPendienteIdentificacion } from '../../application/queries/getAnimalesPendientesIdentificacion'

interface Props {
  animales: AnimalPendienteIdentificacion[]
  total: number
}

// "Madre: Nombre (crotal)", o solo el dato disponible.
function etiquetaMadre(a: AnimalPendienteIdentificacion): string | null {
  if (a.madre_nombre && a.madre_crotal) return `Madre: ${a.madre_nombre} (${a.madre_crotal})`
  if (a.madre_nombre || a.madre_crotal) return `Madre: ${a.madre_nombre ?? a.madre_crotal}`
  return null
}

// Al pulsar un animal se abre el drawer de identificación sin salir del dashboard.
// Antes el clic llevaba a la ficha de la madre (sección "Crías con vínculo activo"):
//   · obligaba a volver al dashboard para identificar el siguiente;
//   · no servía para crías ya destetadas, que desaparecen de esa sección;
//   · para animales sin madre llevaba a su ficha, donde no había forma de identificar.
// La identificación sigue disponible también desde la ficha de la madre y desde la
// ficha del propio animal (AccionIdentificar).
export function WidgetPendientesIdentificacion({ animales, total }: Props) {
  const router = useRouter()
  const [seleccionado, setSeleccionado] = useState<AnimalPendienteIdentificacion | null>(null)

  return (
    <div className="bg-canvas rounded-2xl p-6 shadow-sm border border-divider">

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
            // Fila = botón principal (abre el drawer) + enlace secundario a la madre.
            // Son hermanos, no anidados: un enlace dentro de un botón no es HTML válido.
            <div
              key={a.id}
              className="flex items-center gap-2 rounded-xl bg-surface-alt border border-transparent hover:border-warning/30 hover:bg-warning-soft/50 transition-all group"
            >
              <button
                type="button"
                onClick={() => setSeleccionado(a)}
                className="flex flex-1 min-w-0 items-center gap-4 p-4 text-left cursor-pointer"
                aria-label={`Identificar ${a.crotal ?? 'animal sin crotal'}`}
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
                      etiquetaMadre(a),
                      a.fecha_nacimiento ? formatFecha(a.fecha_nacimiento) : null,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </button>

              {/* Acceso discreto a la ficha de la madre, por si hace falta contexto (p.ej. el parto) */}
              {a.madre_id && (
                <Link
                  href={`/vacuno/animales/${a.madre_id}`}
                  title="Ver ficha de la madre"
                  aria-label="Ver ficha de la madre"
                  className="p-2 mr-2 rounded-lg text-ink-muted/50 hover:text-world hover:bg-canvas transition-colors shrink-0"
                >
                  <ArrowUpRight className="size-4" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drawer de identificación: mismo formulario que en la ficha de la madre */}
      {seleccionado && (
        <DrawerIdentificacion
          animalId={seleccionado.id}
          crotal={seleccionado.crotal}
          sexo={seleccionado.sexo}
          estado_identificacion="pendiente"
          fecha_nacimiento={seleccionado.fecha_nacimiento}
          madre_crotal={seleccionado.madre_crotal}
          padre_crotal={seleccionado.padre_crotal}
          raza_nombre={seleccionado.raza_nombre}
          estado_vital="vivo"
          open={seleccionado !== null}
          onOpenChange={(open) => { if (!open) setSeleccionado(null) }}
          // Refresca el dashboard: el animal identificado sale de la lista y baja el contador.
          // El drawer sigue abierto mostrando el banner de éxito hasta que el usuario lo cierra.
          onSuccess={() => { router.refresh() }}
        />
      )}
    </div>
  )
}
