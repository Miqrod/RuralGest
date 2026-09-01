'use client'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { submitRegistrarAborto } from '@/app/(main)/vacuno/animales/[id]/actions'
import { formatFecha, isoStringToDate } from '@/lib/format'

// ── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  fecha:         z.string().min(1, 'La fecha es obligatoria.'),
  observaciones: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  animalId:          string
  crotal?:           string | null
  nombre?:           string | null
  fechaUltimoEvento?: string | null
  onSuccess:         () => void
  onCancel:          () => void
}

// ── Componente ───────────────────────────────────────────────────────────────

export function FormAborto({ animalId, crotal, nombre, fechaUltimoEvento, onSuccess, onCancel }: Props) {
  const [serverError,   setServerError]   = useState<string | null>(null)
  const [isSubmitting,  setIsSubmitting]  = useState(false)
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fecha: '', observaciones: '' },
  })

  // Validación correcta → abre el diálogo de confirmación
  function onSubmit(values: FormValues) {
    setServerError(null)
    setPendingValues(values)
  }

  async function handleConfirm() {
    if (!pendingValues) return
    setIsSubmitting(true)

    const result = await submitRegistrarAborto(
      animalId,
      pendingValues.fecha,
      pendingValues.observaciones || undefined,
    )

    setIsSubmitting(false)
    setPendingValues(null)

    if (result?.error) {
      setServerError(result.error)
      return
    }
    onSuccess()
  }

  const animalLabel = nombre && crotal
    ? `${nombre} (crotal: ${crotal})`
    : nombre ?? crotal ?? animalId

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">

        {/* Aviso de irreversibilidad */}
        <div className="rounded-md border border-alert bg-alert-soft px-4 py-3 text-sm text-alert space-y-1">
          <p className="font-medium">Esta acción registrará la pérdida de la gestación antes del parto.</p>
          <p>Al confirmarla, el ciclo reproductivo actual se cerrará con resultado <span className="font-medium">Aborto</span>. Si la hembra es reproductora, se iniciará un nuevo ciclo con estado <span className="font-medium">Vacía</span>.</p>
        </div>

        {/* Fecha al 50% */}
        <div className="grid grid-cols-2 gap-4">
          <Controller name="fecha" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Fecha del aborto *</FieldLabel>
              <DatePicker
                value={field.value || undefined}
                onChange={(v) => field.onChange(v ?? '')}
                maxDate={new Date()}
                minDate={fechaUltimoEvento ? isoStringToDate(fechaUltimoEvento) : undefined}
                placeholder="dd/mm/aaaa"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />
        </div>

        {/* Observaciones */}
        <Controller name="observaciones" control={form.control} render={({ field }) => (
          <Field>
            <FieldLabel>
              Observaciones <span className="text-ink-muted font-normal">(opcional)</span>
            </FieldLabel>
            <Textarea {...field} rows={3} placeholder="Causa, circunstancias, notas veterinarias…" />
          </Field>
        )} />

        <div className="flex items-center gap-4">
          {serverError && (
            <p className="text-sm text-alert mr-auto">{serverError}</p>
          )}
          <Button
            type="button"
            variant="ghost"
            className="h-auto py-2 px-6 ml-auto"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" className="h-auto py-2 px-6">
            Registrar aborto
          </Button>
        </div>

      </form>

      {/* ── Diálogo de confirmación ─────────────────────────────────────────── */}
      <Dialog
        open={pendingValues !== null}
        onOpenChange={(open) => { if (!open) setPendingValues(null) }}
      >
        <DialogContent showCloseButton={false} className="ring-alert/40">
          <DialogHeader>
            <DialogTitle className="text-alert">¿Confirmar aborto?</DialogTitle>
          </DialogHeader>

          {pendingValues && (
            <div className="space-y-2 text-sm text-ink">
              <p>Se registrará el aborto de:</p>
              <ul className="space-y-1 text-ink-muted pl-1">
                <li>Animal: <span className="text-ink">{animalLabel}</span></li>
                <li>Fecha: <span className="text-ink">{formatFecha(pendingValues.fecha)}</span></li>
              </ul>
              <p className="text-ink-muted text-xs pt-1">La gestación quedará finalizada.</p>
              <p className="text-ink-muted text-xs">Si continúa siendo reproductora, podrá volver a cubrirse y comenzar una nueva gestación.</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingValues(null)}
              disabled={isSubmitting}
            >
              Volver al formulario
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
