'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { ReubicacionFlow } from '@/modules/ganadero/instalaciones/ui/reubicacion/ReubicacionFlow'
import { submitRegistrarReubicacion } from '@/app/(main)/instalaciones/actions'
import type { AnimalParaReubicar, InstalacionDestino } from '@/modules/ganadero/instalaciones/domain/types'

interface Props {
  animales: AnimalParaReubicar[]
  total: number
  destinos: InstalacionDestino[]
}

// Sub-widget por especie: tarjeta translúcida sobre el fondo verde del widget padre.
// El botón se desactiva cuando no hay animales pendientes.
function SubWidgetEspecie({
  label,
  total,
  onUbicar,
}: {
  label: string
  total: number
  onUbicar?: () => void
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 flex flex-col items-center gap-2 text-white border border-white/10">
      <span className="text-[11px] font-black tracking-widest text-white/70 uppercase">
        {label}
      </span>
      <span className="text-5xl font-black tabular-nums tracking-tighter leading-none">
        {total}
      </span>
      <span className="text-xs text-white/70">
        {total === 1 ? 'animal pendiente' : 'animales pendientes'}
      </span>
      <Button
        onClick={onUbicar}
        disabled={total === 0}
        className="mt-1 bg-white text-world hover:bg-white/90 shadow h-auto py-2 px-6 disabled:opacity-40"
      >
        Ubicar
      </Button>
    </div>
  )
}

export function WidgetPendientesUbicacion({ animales, total, destinos }: Props) {
  const router = useRouter()
  const [openVacuno, setOpenVacuno] = useState(false)
  const [flowKey, setFlowKey] = useState(0)

  function handleSuccess() {
    toast.success('Animales ubicados correctamente')
    setOpenVacuno(false)
    setFlowKey((k) => k + 1)
    router.refresh()
  }

  function handleCancel() {
    setFlowKey((k) => k + 1)
  }

  return (
    <>
      <div className="@container bg-world-gradient rounded-2xl p-6 text-white shadow-md relative overflow-hidden h-full flex flex-col">

        <h3 className="text-lg font-extrabold tracking-tight text-white/90 mb-4 relative z-10">
          Pendientes de ubicar
        </h3>

        {/* Grid de sub-widgets — 1 col en estrecho, 2 col a partir de ~400px de contenedor */}
        <div className="grid grid-cols-1 @[400px]:grid-cols-2 gap-4 flex-1 relative z-10">
          <SubWidgetEspecie
            label="Vacuno"
            total={total}
            onUbicar={() => setOpenVacuno(true)}
          />
          {/* Placeholder porcino — se activará cuando exista el mundo porcino */}
          <SubWidgetEspecie
            label="Porcino"
            total={0}
          />
        </div>

        {/* Decoración de fondo */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      <Sheet open={openVacuno} onOpenChange={setOpenVacuno}>
        <SheetContent className="flex flex-col sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Ubicar animales (vacuno)</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-5">
            <ReubicacionFlow
              key={flowKey}
              modo="pending"
              animales={animales}
              destinos={destinos}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              submitReubicacion={submitRegistrarReubicacion}
              classNamePaso2="pt-4"
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
