'use client'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { submitConfirmacionGestacion } from '@/app/(main)/vacuno/animales/[id]/actions'

// ── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  fecha:         z.string().min(1, 'La fecha es obligatoria.'),
  observaciones: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  animalId:  string
  crotal?:   string | null
  onSuccess: () => void
  onCancel:  () => void
}

// ── Componente ───────────────────────────────────────────────────────────────

export function FormConfirmacionGestacion({ animalId, onSuccess, onCancel }: Props) {
  const [serverError, setServerError]   = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fecha: '', observaciones: '' },
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setServerError(null)

    const result = await submitConfirmacionGestacion(
      animalId,
      values.fecha,
      values.observaciones || undefined,
    )

    setIsSubmitting(false)

    if (result?.error) {
      setServerError(result.error)
      return
    }
    onSuccess()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">

      <Controller name="fecha" control={form.control} render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>Fecha de confirmación *</FieldLabel>
          <DatePicker
            value={field.value || undefined}
            onChange={(v) => field.onChange(v ?? '')}
            maxDate={new Date()}
            placeholder="dd/mm/aaaa"
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )} />

      <Controller name="observaciones" control={form.control} render={({ field }) => (
        <Field>
          <FieldLabel>Observaciones <span className="text-ink-muted font-normal">(opcional)</span></FieldLabel>
          <Textarea
            {...field}
            rows={3}
            placeholder="Método de diagnóstico, resultado ecografía…"
          />
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
        <Button
          type="submit"
          className="h-auto py-2 px-6"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando…' : 'Confirmar gestación'}
        </Button>
      </div>

    </form>
  )
}
