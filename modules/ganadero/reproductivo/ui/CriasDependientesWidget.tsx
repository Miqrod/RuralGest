'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FichaSection } from '@/modules/ganadero/animales/ui/ficha/FichaSection'
import { DrawerIdentificacion } from '@/modules/ganadero/animales/ui/identificacion/DrawerIdentificacion'
import type { CriaResumen } from '../application/queries/getHistorialReproductivo'

const SEXO_SYMBOL: Record<string, string> = { macho: '♂', hembra: '♀' }

interface Props {
  crias:       CriaResumen[]
  madreCrotal: string | null
}

export function CriasDependientesWidget({ crias, madreCrotal }: Props) {
  const router = useRouter()
  const [criaSeleccionada, setCriaSeleccionada] = useState<CriaResumen | null>(null)

  return (
    <>
      <FichaSection title="Crías con vínculo activo">
        <ul className="space-y-2">
          {crias.map(cria => {
            const sexo      = cria.sexo ? (SEXO_SYMBOL[cria.sexo] ?? null) : null
            const base      = cria.nombre ?? cria.crotal ?? 'Sin identificar'
            const label     = sexo ? `${sexo} – ${base}` : base
            const pendiente = cria.estado_identificacion === 'pendiente'

            return (
              <li key={cria.id} className="flex items-center gap-2 text-sm">
                <span className="w-1 h-1 rounded-full bg-ink-muted/40 flex-shrink-0" />
                <Link
                  href={`/vacuno/animales/${cria.id}`}
                  className="text-ink hover:underline hover:text-ink/80 transition-colors"
                >
                  {label}
                </Link>
                {pendiente ? (
                  <>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-warning-soft text-warning">
                      Pendiente
                    </span>
                    <button
                      type="button"
                      onClick={() => setCriaSeleccionada(cria)}
                      className="text-xs text-warning underline underline-offset-2 hover:text-warning/80 transition-colors cursor-pointer"
                    >
                      Identificar
                    </button>
                  </>
                ) : (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-success-soft text-success">
                    {cria.sexo === 'macho' ? 'Vivo' : 'Viva'}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </FichaSection>

      {criaSeleccionada && (
        <DrawerIdentificacion
          animalId={criaSeleccionada.id}
          crotal={criaSeleccionada.crotal}
          sexo={criaSeleccionada.sexo}
          estado_identificacion={criaSeleccionada.estado_identificacion}
          fecha_nacimiento={criaSeleccionada.fecha_nacimiento}
          madre_crotal={madreCrotal}
          padre_crotal={criaSeleccionada.padre_crotal}
          raza_nombre={criaSeleccionada.raza_nombre}
          estado_vital="vivo"
          open={criaSeleccionada !== null}
          onOpenChange={(open) => { if (!open) setCriaSeleccionada(null) }}
          onSuccess={() => { router.refresh() }}
        />
      )}
    </>
  )
}
