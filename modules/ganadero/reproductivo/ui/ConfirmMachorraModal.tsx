'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { submitRegistrarMachorra } from '@/app/(main)/vacuno/animales/[id]/actions'
import { formatFechaLarga } from '@/lib/format'

interface Props {
  open:      boolean
  onClose:   () => void
  animalId:  string
  crotal?:   string | null
  nombre?:   string | null
  onSuccess: () => void
}

export function ConfirmMachorraModal({ open, onClose, animalId, crotal, nombre, onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError,  setServerError]  = useState<string | null>(null)

  // La fecha se genera en el momento de renderizar el modal, igual que lo hará el RPC.
  // Se muestra para que el usuario sepa qué fecha quedará registrada.
  const fechaHoy = formatFechaLarga(new Date())

  const animalLabel = nombre && crotal
    ? `${nombre} (crotal: ${crotal})`
    : nombre ?? crotal ?? animalId

  async function handleConfirm() {
    setIsSubmitting(true)
    setServerError(null)

    const result = await submitRegistrarMachorra(animalId)

    setIsSubmitting(false)

    if (result?.error) {
      setServerError(result.error)
      return
    }
    onSuccess()
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isSubmitting) {
      setServerError(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="ring-warning/40">
        <DialogHeader>
          <DialogTitle>¿Marcar como machorra?</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm text-ink">
          <p>Se registrará que esta oportunidad reproductiva no ha dado resultado para:</p>
          <ul className="space-y-1 text-ink-muted pl-1">
            <li>Animal: <span className="text-ink font-medium">{animalLabel}</span></li>
            <li>Fecha: <span className="text-ink">{fechaHoy}</span></li>
          </ul>
          <p className="text-ink-muted text-xs pt-1">
            El ciclo reproductivo actual se cerrará.
            La hembra quedará de nuevo en estado <span className="font-medium">Vacía</span> y podrá comenzar una nueva oportunidad reproductiva.
          </p>
        </div>

        {serverError && (
          <p className="text-sm text-alert">{serverError}</p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => { setServerError(null); onClose() }}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando…' : 'Marcar como machorra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
