'use client'

import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { submitRegistrarParto } from '@/app/(main)/vacuno/animales/[id]/actions'
import { formatFecha } from '@/lib/format'

// ── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  fecha:           z.string().min(1, 'La fecha es obligatoria.'),
  tipo_parto:      z.enum(['natural', 'asistido'], { error: 'Selecciona el tipo de parto.' }),
  // z.number() (no coerce) para que el input type de Zod sea number y el Resolver sea compatible con useForm<FormValues>.
  // Los onChange usan valueAsNumber; NaN en los defaults deja el input visualmente vacío.
  numero_nacidos:  z.number({ error: 'Introduce el número de nacidos.' }).int().min(1, 'Debe nacer al menos 1 cría.'),
  numero_vivos:    z.number({ error: 'Introduce el número de vivos.' }).int().min(0, 'No puede ser negativo.'),
  observaciones:   z.string().optional(),
}).refine(
  v => v.numero_vivos <= v.numero_nacidos,
  { message: 'Los vivos no pueden superar los nacidos.', path: ['numero_vivos'] },
)

type FormValues = z.infer<typeof schema>

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  animalId:  string
  crotal?:   string | null
  nombre?:   string | null
  onSuccess: (vivos: number, muertos: number) => void
  onCancel:  () => void
}

const TIPO_LABEL: Record<'natural' | 'asistido', string> = {
  natural:  'Natural',
  asistido: 'Asistido',
}

// ── Componente ───────────────────────────────────────────────────────────────

export function FormParto({ animalId, crotal, nombre, onSuccess, onCancel }: Props) {
  const [serverError,   setServerError]   = useState<string | null>(null)
  const [isSubmitting,  setIsSubmitting]  = useState(false)
  // Valores pendientes de confirmación; no-null significa que el dialog está abierto.
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha:          '',
      tipo_parto:     '' as 'natural' | 'asistido',
      numero_nacidos: NaN,   // NaN → input aparece vacío visualmente en type="number"
      numero_vivos:   NaN,
      observaciones:  '',
    },
  })

  // numero_muertos se calcula en tiempo real — no es un campo del formulario
  const [nacidos, vivos] = useWatch({ control: form.control, name: ['numero_nacidos', 'numero_vivos'] })
  const muertos = Number(nacidos) >= 0 && Number(vivos) >= 0
    ? Math.max(0, Number(nacidos) - Number(vivos))
    : null

  // Validación correcta → abre confirmación en lugar de persistir directamente
  function onSubmit(values: FormValues) {
    setServerError(null)
    setPendingValues(values)
  }

  async function handleConfirm() {
    if (!pendingValues) return
    setIsSubmitting(true)

    const result = await submitRegistrarParto(animalId, {
      fecha_parto:    pendingValues.fecha,
      tipo_parto:     pendingValues.tipo_parto,
      numero_nacidos: pendingValues.numero_nacidos,
      numero_vivos:   pendingValues.numero_vivos,
      numero_muertos: pendingValues.numero_nacidos - pendingValues.numero_vivos,
      observaciones:  pendingValues.observaciones || undefined,
    })

    setIsSubmitting(false)
    setPendingValues(null)

    if ('error' in result) {
      setServerError(result.error)
      return
    }
    onSuccess(pendingValues.numero_vivos, pendingValues.numero_nacidos - pendingValues.numero_vivos)
  }

  const muertosConfirm = pendingValues
    ? pendingValues.numero_nacidos - pendingValues.numero_vivos
    : 0

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">

        {/* Fila 1: fecha + tipo de parto */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Controller name="fecha" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Fecha de parto *</FieldLabel>
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

          <Controller name="tipo_parto" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Tipo de parto *</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="natural">Natural</SelectItem>
                  <SelectItem value="asistido">Asistido</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />
        </div>

        {/* Fila 2: nacidos / vivos / muertos (derivado) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Controller name="numero_nacidos" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Total nacidos *</FieldLabel>
              <Input
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="0"
                aria-invalid={fieldState.invalid}
                {...field}
                value={Number.isNaN(field.value) ? '' : field.value}
                onChange={e => field.onChange(e.target.valueAsNumber)}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />

          <Controller name="numero_vivos" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Crías vivas *</FieldLabel>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0"
                aria-invalid={fieldState.invalid}
                {...field}
                value={Number.isNaN(field.value) ? '' : field.value}
                onChange={e => field.onChange(e.target.valueAsNumber)}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />

          {/* Muertos: calculado automáticamente, no editable */}
          <Field>
            <FieldLabel>
              Crías muertas <span className="text-ink-muted font-normal">(calculado)</span>
            </FieldLabel>
            <Input
              type="number"
              value={muertos ?? ''}
              readOnly
              disabled
              className="bg-surface-alt cursor-default"
              tabIndex={-1}
            />
          </Field>
        </div>

        {/* Fila 3: observaciones */}
        <Controller name="observaciones" control={form.control} render={({ field }) => (
          <Field>
            <FieldLabel>
              Observaciones <span className="text-ink-muted font-normal">(opcional)</span>
            </FieldLabel>
            <Textarea {...field} rows={3} placeholder="Notas sobre el parto…" />
          </Field>
        )} />

        {/* Acciones */}
        <div className="flex items-center gap-4">
          {serverError && (
            <p className="text-sm text-alert mr-auto">{serverError}</p>
          )}
          <Button
            type="button"
            variant="ghost"
            className="h-auto py-2 px-6 ml-auto"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button type="submit" className="h-auto py-2 px-6">
            Registrar parto
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
            <DialogTitle>¿Confirmar registro de parto?</DialogTitle>
          </DialogHeader>

          {pendingValues && (
            <div className="space-y-3 text-sm text-ink">
              <p>
                Se registrará el parto del animal{' '}
                <span className="font-medium">
                  {nombre && crotal
                    ? `${nombre} (crotal: ${crotal})`
                    : nombre ?? crotal ?? animalId}
                </span>:
              </p>
              <ul className="space-y-1 text-ink-muted pl-1">
                <li>Fecha: <span className="text-ink">{formatFecha(pendingValues.fecha)}</span></li>
                <li>Tipo: <span className="text-ink">{TIPO_LABEL[pendingValues.tipo_parto]}</span></li>
                <li>
                  Crías:{' '}
                  <span className="text-ink">
                    {pendingValues.numero_vivos === 1
                      ? '1 animal vivo'
                      : `${pendingValues.numero_vivos} animales vivos`}
                    {muertosConfirm > 0 && ` y ${muertosConfirm} ${muertosConfirm === 1 ? 'muerto' : 'muertos'}`}
                  </span>
                </li>
              </ul>
              <p className="text-ink-muted text-xs pt-1">
                Esta acción registrará las crías, fijará el desenlace del ciclo actual como <span className="font-medium">parto</span> e iniciará un nuevo ciclo reproductivo en estado <span className="font-medium">vacía</span>.
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
            <Button
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
