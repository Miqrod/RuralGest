'use client'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { AnimalSelector } from '@/components/ui/animal-selector'
import type { AnimalOption } from '@/components/ui/animal-selector'
import { submitConfirmacionGestacion } from '@/app/(main)/vacuno/animales/[id]/actions'
import type { EstadoReproductivo } from '@/modules/ganadero/shared/domain/types'
import type { MachoOption } from '@/modules/ganadero/animales/application/queries/getMachosDisponibles'

// Sentinel para el selector cuando el padre es desconocido.
// Se convierte a undefined antes de enviar al servidor.
const PADRE_DESCONOCIDO = '__desconocido__'

function machoToOption(m: MachoOption): AnimalOption {
  const label = [m.nombre, m.raza_nombre].filter(Boolean).join(' · ') || m.crotal || m.id
  return { id: m.id, label, sublabel: m.crotal ?? undefined }
}

// ── Schema ───────────────────────────────────────────────────────────────────

// meses_estimados y padre_id son obligatorios cuando no hay cubrición previa (desde vacia).
// La validación condicional la gestiona onSubmit: Zod valida formato, el submit valida presencia.
const schema = z.object({
  fecha:           z.string().min(1, 'La fecha es obligatoria.'),
  meses_estimados: z.number().int().min(1).max(9).optional(),
  padre_id:        z.string().optional(),
  observaciones:   z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  animalId:           string
  crotal?:            string | null
  estadoReproductivo: EstadoReproductivo
  machos?:            MachoOption[]
  onSuccess:          () => void
  onCancel:           () => void
}

// ── Componente ───────────────────────────────────────────────────────────────

export function FormConfirmacionGestacion({ animalId, estadoReproductivo, machos = [], onSuccess, onCancel }: Props) {
  const [serverError, setServerError]   = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // true cuando no existe cubrición previa registrada
  const sinCubricionPrevia = estadoReproductivo === 'vacia'

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fecha: '', meses_estimados: undefined, observaciones: '' },
  })

  async function onSubmit(values: FormValues) {
    // Validaciones de presencia para campos condicionales (antes del spinner)
    if (sinCubricionPrevia && values.meses_estimados === undefined) {
      form.setError('meses_estimados', { message: 'Indica los meses de gestación estimados.' })
      return
    }
    if (sinCubricionPrevia && !values.padre_id) {
      form.setError('padre_id', { message: 'Selecciona el padre o indica "Desconocido".' })
      return
    }

    setIsSubmitting(true)
    setServerError(null)

    const result = await submitConfirmacionGestacion(
      animalId,
      values.fecha,
      sinCubricionPrevia ? values.meses_estimados : undefined,
      sinCubricionPrevia ? (values.padre_id === PADRE_DESCONOCIDO ? undefined : values.padre_id) : undefined,
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

      {/* ── Fila 1: fecha al 50% ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
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
      </div>

      {/* ── Fila 2: meses (50%) + padre (50%), solo sin cubrición previa ─── */}
      {sinCubricionPrevia && (
        <div className="grid grid-cols-2 gap-4">
          <Controller name="meses_estimados" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>¿De cuántos meses está gestante? *</FieldLabel>
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
                  Estimación para calcular la fecha prevista de parto.
                </p>
              )}
            </Field>
          )} />

          <Controller name="padre_id" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Padre *</FieldLabel>
              <AnimalSelector
                options={[
                  { id: PADRE_DESCONOCIDO, label: 'Desconocido' },
                  ...machos.map(machoToOption),
                ]}
                value={field.value ?? null}
                onChange={(id) => field.onChange(id ?? undefined)}
                placeholder="Seleccionar semental…"
              />
              {fieldState.invalid
                ? <FieldError errors={[fieldState.error]} />
                : <p className="text-xs text-ink-muted">Se asignará a las crías en el parto.</p>
              }
            </Field>
          )} />
        </div>
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
