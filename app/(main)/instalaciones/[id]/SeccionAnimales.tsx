'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft, List } from 'lucide-react'
import { toast } from 'sonner'

import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { ReubicacionFlow } from '@/modules/ganadero/instalaciones/ui/reubicacion/ReubicacionFlow'
import { submitRegistrarReubicacion } from '@/app/(main)/instalaciones/actions'
import { cn } from '@/lib/utils'
import type {
  InstalacionDetalle, AnimalEnInstalacion,
  InstalacionDestino, AnimalParaReubicar,
} from '@/modules/ganadero/instalaciones/domain/types'
import type { Especie } from '@/modules/ganadero/shared/domain/types'

const ESPECIE_LINKS: Record<Especie, string> = {
  vacuno:  '/vacuno/animales',
  porcino: '/porcino/animales',
}

// La fecha de llegada a esta instalación es el último CAMBIO_UBICACION del animal,
// ya que el animal está actualmente aquí (no ha sido reubicado desde que llegó).
function toAnimalParaReubicar(
  a: AnimalEnInstalacion,
  instalacionId: string,
  instalacionNombre: string,
): AnimalParaReubicar {
  return {
    id:                            a.id,
    crotal:                        a.crotal,
    nombre:                        a.nombre,
    sexo:                          a.sexo,
    tipo_productivo_nombre:        a.tipo_productivo_nombre,
    fecha_ultimo_cambio_ubicacion: a.fecha_ubicacion || null,
    ubicacion_actual_id:           instalacionId,
    ubicacion_actual_nombre:       instalacionNombre,
  }
}

type Tab = 'animales' | 'reubicar'

interface Props {
  instalacion: InstalacionDetalle
  animales: AnimalEnInstalacion[]
  destinos: InstalacionDestino[]
}

export function SeccionAnimales({ instalacion, animales, destinos }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('animales')
  const [flowKey, setFlowKey] = useState(0)

  const animalesParaReubicar = useMemo(
    () => animales.map((a) => toAnimalParaReubicar(a, instalacion.id, instalacion.nombre)),
    [animales, instalacion.id, instalacion.nombre],
  )

  function handleSuccess() {
    toast.success('Reubicación completada')
    router.refresh()
    setTab('animales')
    setFlowKey((k) => k + 1)
  }

  function handleCancel() {
    // Resetea selección y vuelve al paso 1 sin cambiar de tab —
    // igual que en /instalaciones/reubicaciones.
    setFlowKey((k) => k + 1)
  }

  return (
    <section className="rounded-lg border border-divider bg-canvas shadow-sm overflow-hidden">

      {/* ── Cabecera de sección ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-divider/50 bg-surface-alt">
        <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wide">
          Animales en esta instalación
        </h3>

          <span className="tabular-nums text-sm font-semibold text-world">
            {instalacion.num_animales}{' '}
            <span className="font-normal text-ink-muted">
              {instalacion.num_animales === 1 ? 'animal' : 'animales'}
            </span>
          </span>
      </div>

      {/* ── Segmented control: Listado / Reubicar ── */}
      <div className="px-5 pt-4 pb-0">
        <div className="inline-flex items-center bg-surface-base border border-divider/60 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setTab('animales')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer',
              tab === 'animales'
                ? 'bg-canvas shadow-sm text-ink'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            <List className="h-3.5 w-3.5" />
            Listado
          </button>
          <button
            type="button"
            onClick={() => setTab('reubicar')}
            disabled={animales.length === 0}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              tab === 'reubicar'
                ? 'bg-canvas shadow-sm text-ink'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Reubicar
          </button>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="p-5">
        {/* Contenedor común: ambas vistas comparten borde, radio y sombra */}
        <div className="rounded-xl border border-divider/60 shadow-sm overflow-hidden">

          {tab === 'animales' ? (
            animales.length === 0 ? (
              <p className="px-5 py-8 text-sm text-ink-muted text-center">
                No hay animales asignados a esta instalación.
              </p>
            ) : (
              <Table>
                <TableHeader className="bg-surface-alt">
                  <TableRow className="border-divider/30">
                    <TableHead className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Crotal</TableHead>
                    <TableHead className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Nombre</TableHead>
                    <TableHead className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Tipo productivo</TableHead>
                    <TableHead className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Desde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {animales.map((a) => (
                    <TableRow key={a.id} className="border-divider/30 hover:bg-surface-alt/50 transition-colors">
                      <TableCell className="px-6 py-4 text-sm">
                        <Link
                          href={`${ESPECIE_LINKS[a.especie]}/${a.id}`}
                          className="font-mono text-world hover:underline underline-offset-2"
                        >
                          {a.crotal ?? <span className="text-ink-muted italic">Sin crotal</span>}
                        </Link>
                      </TableCell>
                      <TableCell className={cn('px-6 py-4 text-sm', !a.nombre && 'text-ink-muted')}>
                        {a.nombre ?? '—'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-ink-muted">
                        {a.tipo_productivo_nombre ?? '—'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-ink-muted tabular-nums">
                        {a.fecha_ubicacion
                          ? new Date(a.fecha_ubicacion).toLocaleDateString('es-ES', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : (
            <ReubicacionFlow
              key={flowKey}
              modo="location"
              animales={animalesParaReubicar}
              destinos={destinos}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              submitReubicacion={submitRegistrarReubicacion}
              classNamePaso2="p-5"
            />
          )}

        </div>
      </div>
    </section>
  )
}
