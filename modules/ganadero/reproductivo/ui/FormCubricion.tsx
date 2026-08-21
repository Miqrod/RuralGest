'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
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
import { AnimalSelector } from '@/components/ui/animal-selector'
import type { AnimalOption } from '@/components/ui/animal-selector'
import type { MachoOption } from '@/modules/ganadero/animales/application/queries/getMachosDisponibles'
import { submitCubricionAnimal } from '@/app/(main)/vacuno/animales/[id]/actions'

// ── Schema ───────────────────────────────────────────────────────────────────

// Sentinel usado en el selector cuando el macho es desconocido.
// Se convierte a undefined antes de enviar al servidor.
const MACHO_DESCONOCIDO = '__desconocido__'

const schema = z.object({
  fecha:           z.string().min(1, 'La fecha es obligatoria.'),
  tipo_cubricion:  z.enum(['natural', 'inseminacion'], { error: 'Selecciona el tipo de cubrición.' }),
  macho_id:        z.string().optional(),
  observaciones:   z.string().optional(),
}).superRefine((data, ctx) => {
  // En cubrición natural el macho es obligatorio: el usuario debe seleccionar uno o "Desconocido"
  if (data.tipo_cubricion === 'natural' && !data.macho_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecciona el macho o indica "Desconocido".',
      path: ['macho_id'],
    })
  }
})

type FormValues = z.infer<typeof schema>

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  animalId: string
  crotal?:  string | null
  machos:   MachoOption[]
  onSuccess: () => void
  onCancel:  () => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Convierte MachoOption (dominio) a AnimalOption (UI genérica).
// Primera línea: nombre · raza — más legible para el ganadero.
// Segunda línea: crotal — identificador inequívoco.
function toAnimalOption(m: MachoOption): AnimalOption {
  const label =
    [m.nombre, m.raza_nombre].filter(Boolean).join(' · ') ||
    m.crotal ||
    'Sin identificar'
  const sublabel =
    (m.nombre || m.raza_nombre) && m.crotal ? `Crotal: ${m.crotal}` : undefined
  return { id: m.id, label, sublabel }
}

// ── Componente ───────────────────────────────────────────────────────────────

export function FormCubricion({ animalId, machos, onSuccess, onCancel }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha:          '',
      tipo_cubricion: '' as 'natural' | 'inseminacion',
      macho_id:       undefined,
      observaciones:  '',
    },
  })

  const tipoCubricion = form.watch('tipo_cubricion')
  // "Desconocido" siempre aparece primero; el sentinel se convierte a undefined al enviar
  const machoOptions: AnimalOption[] = [
    { id: MACHO_DESCONOCIDO, label: 'Desconocido' },
    ...machos.map(toAnimalOption),
  ]

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setServerError(null)

    const result = await submitCubricionAnimal(
      animalId,
      values.fecha,
      values.tipo_cubricion,
      values.macho_id === MACHO_DESCONOCIDO ? undefined : values.macho_id,
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

      {/* Fila 1: fecha + tipo de cubrición */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Controller name="fecha" control={form.control} render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Fecha de cubrición *</FieldLabel>
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

        <Controller name="tipo_cubricion" control={form.control} render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Tipo de cubrición *</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="natural">Natural</SelectItem>
                <SelectItem value="inseminacion">Inseminación artificial</SelectItem>
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )} />
      </div>

      {/* Fila 2: selector de macho — aparece solo en cubrición natural */}
      <AnimatePresence initial={false}>
        {tipoCubricion === 'natural' && (
          <motion.div
            key="macho-field"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <Controller name="macho_id" control={form.control} render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Macho *</FieldLabel>
                  <AnimalSelector
                    options={machoOptions}
                    value={field.value ?? null}
                    onChange={(id) => field.onChange(id ?? undefined)}
                    placeholder="Seleccionar macho…"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fila 3: observaciones */}
      <Controller name="observaciones" control={form.control} render={({ field }) => (
        <Field>
          <FieldLabel>Observaciones <span className="text-ink-muted font-normal">(opcional)</span></FieldLabel>
          <Textarea
            {...field}
            rows={3}
            placeholder="Notas adicionales sobre la cubrición…"
          />
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
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="h-auto py-2 px-6"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando…' : 'Registrar cubrición'}
        </Button>
      </div>

    </form>
  )
}
