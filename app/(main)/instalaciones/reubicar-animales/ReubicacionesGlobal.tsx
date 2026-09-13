'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { ReubicacionFlow } from '@/modules/ganadero/instalaciones/ui/reubicacion/ReubicacionFlow'
import { submitRegistrarReubicacion } from '@/app/(main)/instalaciones/actions'
import type { AnimalParaReubicar, InstalacionDestino } from '@/modules/ganadero/instalaciones/domain/types'

interface Props {
  animales: AnimalParaReubicar[]
  destinos: InstalacionDestino[]
}

export function ReubicacionesGlobal({ animales, destinos }: Props) {
  const router = useRouter()
  // flowKey fuerza el remount de ReubicacionFlow al cancelar o completar,
  // reseteando toda la selección y volviendo al paso 1.
  const [flowKey, setFlowKey] = useState(0)

  function handleSuccess() {
    toast.success('Reubicación completada')
    router.refresh()
    setFlowKey((k) => k + 1)
  }

  function handleCancel() {
    setFlowKey((k) => k + 1)
  }

  return (
    <ReubicacionFlow
      key={flowKey}
      modo="global"
      animales={animales}
      destinos={destinos}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
      submitReubicacion={submitRegistrarReubicacion}
    />
  )
}
