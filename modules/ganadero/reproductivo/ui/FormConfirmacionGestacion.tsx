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
import type { EstadoReproductivo } from '@/modules/ganadero/shared/domain/types'

// ── Schema ───────────────────────────────────────────────────────────────────

// meses_estimados solo es obligatorio cuando no hay cubrición previa (desde vacia).
// La validación condicional la gestiona onSubmit: Zod valida formato, el submit valida presencia.
const schema = z.object({
  fecha:           z.string().min(1, 'La fecha es obligatoria.'),
  meses_estimados: z.number().int().min(1).max(9).optional(),
  observaciones:   z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  animalId:           string
  crotal?:            string | null
  estadoReproductivo: EstadoReproductivo
  onSuccess:          () => void
  onCancel:           () => void
}

// ── Componente ───────────────────────────────────────────────────────────────

export function FormConfirmacionGestacion({ animalId, estadoReproductivo, onSuccess, onCancel }: Props) {
  const [serverError, setServerError]   = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // true cuando no existe cubrición previa registrada
  const sinCubricionPrevia = estadoReproductivo === 'vacia'

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fecha: '', meses_estimados: undefined, observaciones: '' },
  })

  async function onSubmit(values: FormValues) {
    // Validación de presencia para el campo condicional
    if (sinCubricionPrevia && values.meses_estimados === undefined) {
      form.setError('meses_estimados', { message: 'Indica los meses de gestación estimados.' })
      return
    }

    setIsSubmitting(true)
    setServerError(null)

    const result = await submitConfirmacionGestacion(
      animalId,
      values.fecha,
      sinCubricionPrevia ? values.meses_estimados : undefined,
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

      {/* ── Aviso informativo: solo cuando no hay cubrición previa ─────────── */}
      {sinCubricionPrevia && (
        <div className="rounded-md border border-warning bg-warning-soft px-4 py-3 text-sm text-warning space-y-1">
          <p className="font-medium">No hay ninguna cubrición registrada para este animal.</p>
          <p>Lo más recomendable es registrar primero la cubrición y, posteriormente, confirmar la gestación.</p>
          <p>Si no conoces la fecha de la cubrición, puedes continuar registrando directamente la gestación.</p>
          <p>Una vez registrada, ya no será posible añadir una cubrición para esta misma gestación.</p>
        </div>
      )}

      {/* ── Fecha de confirmación ──────────────────────────────────────────── */}
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

      {/* ── Meses de gestación estimados: solo cuando no hay cubrición previa  */}
      {sinCubricionPrevia && (
        <Controller name="meses_estimados" control={form.control} render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>¿De cuántos meses está gestante aproximadamente? *</FieldLabel>
            <div className="flex flex-wrap gap-2 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((mes) => (
                <button
                  key={mes}
                  type="button"
                  onClick={() => field.onChange(mes)}
                  className={[
                    'size-10 rounded-md border text-sm font-medium transition-colors',
                    field.value === mes
                      ? 'border-brand bg-brand text-white'
                      : 'border-divider bg-canvas text-ink hover:border-brand hover:text-brand',
                  ].join(' ')}
                >
                  {mes}
                </button>
              ))}
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            {!fieldState.invalid && (
              <p className="text-xs text-ink-muted">
                Solo se solicita una estimación aproximada para calcular la fecha prevista de parto.
              </p>
            )}
          </Field>
        )} />
      )}

      {/* ── Observaciones ─────────────────────────────────────────────────── */}
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
