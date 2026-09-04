'use client'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Checkbox } from '@/components/ui/checkbox'
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
import { submitRegistrarDesteteLote } from '@/app/(main)/vacuno/animales/[id]/actions'
import { formatFecha } from '@/lib/format'
import type { CriaParaDesteteItem } from '../application/queries/getCriasParaDestete'

// ── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  criaIds:       z.array(z.string()).min(1, 'Selecciona al menos una cría.'),
  fecha:         z.string().min(1, 'La fecha es obligatoria.'),
  observaciones: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  madreId:     string
  madreNombre?: string | null
  madreCrotal?: string | null
  criasElegibles: CriaParaDesteteItem[]
  onSuccess:   (count: number, cicloCerrado: boolean) => void
  onCancel:    () => void
}

const SEXO_LABEL: Record<string, string> = {
  macho:   'Macho',
  hembra:  'Hembra',
}

function hoy(): string {
  return new Date().toISOString().split('T')[0]
}

// ── Componente ───────────────────────────────────────────────────────────────

export function FormDestete({
  madreId,
  madreNombre,
  madreCrotal,
  criasElegibles,
  onSuccess,
  onCancel,
}: Props) {
  const [serverError,   setServerError]   = useState<string | null>(null)
  const [isSubmitting,  setIsSubmitting]  = useState(false)
  // Valores pendientes de confirmación; no-null significa que el dialog está abierto.
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      criaIds:       [],
      fecha:         hoy(),
      observaciones: '',
    },
  })

  // Validación correcta → abre confirmación en lugar de persistir directamente
  function onSubmit(values: FormValues) {
    setServerError(null)
    setPendingValues(values)
  }

  async function handleConfirm() {
    if (!pendingValues) return
    setIsSubmitting(true)

    // Una única llamada al Server Action: el RPC registrar_destete_lote garantiza
    // atomicidad total. Si alguna cría no es elegible, ninguna queda aplicada.
    const res = await submitRegistrarDesteteLote(
      pendingValues.criaIds,
      madreId,
      pendingValues.fecha,
      pendingValues.observaciones || undefined,
    )

    if ('error' in res) {
      setServerError(res.error)
      setIsSubmitting(false)
      setPendingValues(null)
      return
    }

    setIsSubmitting(false)
    setPendingValues(null)
    onSuccess(pendingValues.criaIds.length, res.result.cicloCerrado)
  }

  const madreLabel = madreNombre && madreCrotal
    ? `${madreNombre} (crotal: ${madreCrotal})`
    : madreNombre ?? madreCrotal ?? madreId

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">

        {/* Selección de crías ──────────────────────────────────────────────── */}
        <Controller name="criaIds" control={form.control} render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Crías a destetar *</FieldLabel>
            <div className="mt-1 space-y-2">
              {criasElegibles.length === 0
                ? (
                  <p className="text-sm text-ink-muted">No hay crías elegibles para destete.</p>
                )
                : criasElegibles.map(cria => (
                  <label
                    key={cria.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md p-2 transition-colors hover:bg-surface-alt"
                  >
                    <Checkbox
                      checked={field.value.includes(cria.id)}
                      onCheckedChange={() => {
                        const current = field.value
                        field.onChange(
                          current.includes(cria.id)
                            ? current.filter((x: string) => x !== cria.id)
                            : [...current, cria.id],
                        )
                      }}
                      className="mt-0.5"
                    />
                    <div className="text-sm leading-snug">
                      <span className="font-medium text-ink">
                        {cria.crotal ?? '(sin identificar)'}
                      </span>
                      {cria.nombre && (
                        <span className="ml-1 text-ink-muted">— {cria.nombre}</span>
                      )}
                      <span className="block text-ink-muted">
                        {cria.sexo ? (SEXO_LABEL[cria.sexo] ?? cria.sexo) : 'Sin determinar'}
                        {cria.fecha_nacimiento && ` · ${formatFecha(cria.fecha_nacimiento)}`}
                        {cria.edad_dias !== null && ` · ${cria.edad_dias} días`}
                      </span>
                    </div>
                  </label>
                ))
              }
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )} />

        {/* Fecha de destete ────────────────────────────────────────────────── */}
        <Controller name="fecha" control={form.control} render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Fecha de destete *</FieldLabel>
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

        {/* Observaciones ───────────────────────────────────────────────────── */}
        <Controller name="observaciones" control={form.control} render={({ field }) => (
          <Field>
            <FieldLabel>
              Observaciones <span className="font-normal text-ink-muted">(opcional)</span>
            </FieldLabel>
            <Textarea {...field} rows={3} placeholder="Notas sobre el destete…" />
          </Field>
        )} />

        {/* Acciones ────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          {serverError && (
            <p className="mr-auto text-sm text-alert">{serverError}</p>
          )}
          <Button
            type="button"
            variant="ghost"
            className="ml-auto h-auto px-6 py-2"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="h-auto px-6 py-2"
            disabled={criasElegibles.length === 0}
          >
            Registrar destete
          </Button>
        </div>

      </form>

      {/* ── Dialog de confirmación ──────────────────────────────────────────── */}
      <Dialog
        open={pendingValues !== null}
        onOpenChange={(open) => { if (!open) setPendingValues(null) }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>¿Confirmar destete?</DialogTitle>
          </DialogHeader>

          {pendingValues && (
            <div className="space-y-3 text-sm text-ink">
              <p>
                Se registrará el destete de{' '}
                <span className="font-medium">
                  {pendingValues.criaIds.length === 1 ? '1 cría' : `${pendingValues.criaIds.length} crías`}
                </span>{' '}
                de <span className="font-medium">{madreLabel}</span>:
              </p>
              <ul className="space-y-1 pl-1 text-ink-muted">
                {pendingValues.criaIds.map(id => {
                  const cria = criasElegibles.find(c => c.id === id)
                  return (
                    <li key={id}>
                      {cria?.crotal ?? '(sin identificar)'}
                      {cria?.nombre ? ` — ${cria.nombre}` : ''}
                    </li>
                  )
                })}
              </ul>
              <ul className="space-y-1 pl-1 text-ink-muted">
                <li>
                  Fecha: <span className="text-ink">{formatFecha(pendingValues.fecha)}</span>
                </li>
              </ul>
              <p className="pt-1 text-xs text-ink-muted">
                {pendingValues.criaIds.length === 1
                  ? 'La cría quedará destetada y pasará a la siguiente etapa (Recría).'
                  : 'Las crías seleccionadas quedarán destetadas y pasarán a la siguiente etapa (Recría).'}
                {pendingValues.criaIds.length === criasElegibles.length && (
                  <>{' '}Con este destete, la madre quedará disponible para iniciar un nuevo ciclo reproductivo.</>
                )}
              </p>
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
            <Button onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
