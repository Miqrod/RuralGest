'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DrawerIdentificacion } from './DrawerIdentificacion'
import { Button } from '@/components/ui/button'
import type { ISODate } from '@/modules/shared/types'
import type { Sexo, EstadoVital, EstadoIdentificacion } from '@/modules/ganadero/shared/domain/types'
import type { AnimalIdentificationStatus } from '@/modules/ganadero/animales/domain/IdentificationRules'

interface Props {
  animalId:              string
  crotal:                string | null
  sexo:                  Sexo
  estado_identificacion: EstadoIdentificacion   // nunca null: solo se renderiza cuando aplica
  fecha_nacimiento:      ISODate | null
  madre_crotal:          string | null
  padre_crotal:          string | null
  raza_nombre:           string | null
  estado_vital:          EstadoVital
}

export function AccionIdentificar({
  animalId,
  crotal,
  sexo,
  estado_identificacion,
  fecha_nacimiento,
  madre_crotal,
  padre_crotal,
  raza_nombre,
  estado_vital,
}: Props) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  function handleSuccess(status: AnimalIdentificationStatus) {
    // Refresca el Server Component para que el badge de estado se actualice
    router.refresh()
    if (status.estado === 'completa') {
      // El drawer muestra el banner de éxito; el usuario lo cierra manualmente
      return
    }
    setDrawerOpen(false)
  }

  const pendiente = estado_identificacion === 'pendiente'

  return (
    <>
      {/* Banner visible cuando la identificación está pendiente */}
      {pendiente && (
        <div className="flex items-center justify-between rounded-lg border border-warning bg-warning-soft px-5 py-3">
          <p className="text-sm text-warning font-medium">
            Identificación pendiente
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-auto py-1.5 px-4 text-sm border-warning text-warning hover:bg-warning/10"
            onClick={() => setDrawerOpen(true)}
          >
            Identificar
          </Button>
        </div>
      )}

      <DrawerIdentificacion
        animalId={animalId}
        crotal={crotal}
        sexo={sexo}
        estado_identificacion={estado_identificacion}
        fecha_nacimiento={fecha_nacimiento}
        madre_crotal={madre_crotal}
        padre_crotal={padre_crotal}
        raza_nombre={raza_nombre}
        estado_vital={estado_vital}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSuccess={handleSuccess}
      />
    </>
  )
}
