'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { submitEntradaCompra } from '@/app/(main)/vacuno/animales/entrada/actions'
import type { RazaOption } from '@/modules/ganadero/animales/application/queries/listarRazas'
import type { TipoProductivoOption } from '@/modules/ganadero/animales/application/queries/listarTiposProductivos'

// ── Schema de validación ─────────────────────────────────────────────────────

const schema = z
  .object({
    // Zod v4: usa 'message' como catch-all en lugar de 'required_error'
    sexo:               z.enum(['macho', 'hembra'], { message: 'Selecciona el sexo.' }),
    tipo_productivo_id: z.string().min(1, 'Selecciona un tipo productivo.'),
    crotal:             z.string().optional(),
    num_hierro:         z.string().optional(),
    raza_id:            z.string().optional(),
    // El toggle determina si la fecha es exacta o estimada; siempre es obligatoria
    fecha_nac_tipo:     z.enum(['real', 'estimada']),
    fecha_nac:          z.string().min(1, 'La fecha de nacimiento es obligatoria.'),
    fecha_compra:       z.string().min(1, 'La fecha de compra es obligatoria.'),
  })
  .superRefine((data, ctx) => {
    // fecha_nac siempre requerida — la DB exige al menos una de las dos fechas de nacimiento
    if (!data.fecha_nac) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La fecha de nacimiento es obligatoria.',
        path: ['fecha_nac'],
      })
    }
    // Crotal: si se rellena debe tener formato ES + 12 dígitos
    if (data.crotal && !/^[A-Z]{2}\d{12}$/.test(data.crotal)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Formato: 2 letras + 12 dígitos (ej. ES001234567890).',
        path: ['crotal'],
      })
    }
  })

type FormValues = z.infer<typeof schema>

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  razas:             RazaOption[]
  tiposProductivos:  TipoProductivoOption[]
}

// ── Componente ───────────────────────────────────────────────────────────────

export function FormEntradaCompra({ razas, tiposProductivos }: Props) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      // String vacío: el Select queda siempre controlled (value nunca es undefined).
      // Zod rechaza '' en el enum al hacer submit, mostrando el mensaje de error correcto.
      sexo:               '' as 'macho' | 'hembra',
      tipo_productivo_id: '',
      crotal:             '',
      num_hierro:         '',
      raza_id:            '',
      fecha_nac_tipo:     'real',
      fecha_nac:          '',
      fecha_compra:       '',
    },
  })

  const fechaNacTipo = form.watch('fecha_nac_tipo')

  async function onSubmit(values: FormValues) {
    setServerError(null)

    // Construimos el input de dominio a partir del estado del formulario.
    // Solo se incluye un campo de fecha de nacimiento, nunca ambos.
    const result = await submitEntradaCompra({
      especie:                    'vacuno',
      sexo:                       values.sexo,
      tipo_productivo_id:         values.tipo_productivo_id,
      crotal:                     values.crotal || undefined,
      num_hierro:                 values.num_hierro || undefined,
      raza_id:                    values.raza_id || undefined,
      fecha_nacimiento:          values.fecha_nac_tipo === 'real'     ? values.fecha_nac : undefined,
      fecha_nacimiento_estimada: values.fecha_nac_tipo === 'estimada' ? values.fecha_nac : undefined,
      fecha_compra:               values.fecha_compra,
    })

    if ('error' in result) {
      setServerError(result.error)
      return
    }

    toast.success('Animal registrado correctamente')
    router.push(`/vacuno/animales/${result.id}`)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {/* Tarjeta de formulario: fondo blanco, sombra sutil, misma estética que referencia */}
      <div className="bg-canvas rounded-xl border border-divider/20 shadow-sm p-8 space-y-8">

        {/* ── Fila 1: Identificadores ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Controller name="crotal" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Crotal</FieldLabel>
              <Input {...field} id={field.name} placeholder="ES001234567890" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />

          <Controller name="num_hierro" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Número de hierro</FieldLabel>
              <Input {...field} id={field.name} placeholder="Código de hierro" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />

          {/* Columna vacía para mantener alineación 3 columnas */}
          <div />
        </div>

        {/* ── Fila 2: Características biológicas ──────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Controller name="sexo" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Sexo *</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Selecciona el sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hembra">Hembra</SelectItem>
                  <SelectItem value="macho">Macho</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />

          <Controller name="tipo_productivo_id" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Tipo productivo *</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                  {/* Base UI no refleja ItemText de portales automáticamente:
                      usamos children render fn para mapear UUID → nombre */}
                  <SelectValue>
                    {(value: string | null) =>
                      value
                        ? tiposProductivos.find((t) => t.id === value)?.nombre ?? value
                        : 'Selecciona un tipo'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tiposProductivos.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />

          <Controller name="raza_id" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Raza</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                  <SelectValue>
                    {(value: string | null) =>
                      value
                        ? razas.find((r) => r.id === value)?.nombre ?? value
                        : 'Selecciona una raza'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {razas.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />
        </div>

        {/* ── Fila 3: Fecha de nacimiento ──────────────────────────────────── */}
        {/* Col 1: input de fecha (siempre visible)
            Cols 2+3: segmented control fluido que determina el tipo de fecha */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Field data-invalid={!!form.formState.errors.fecha_nac}>
            <FieldLabel htmlFor="fecha_nac">
              {fechaNacTipo === 'real' ? 'F. nac. real' : 'F. nac. estimada'}
            </FieldLabel>
            <Controller name="fecha_nac" control={form.control} render={({ field }) => (
              <DatePicker
                value={field.value || undefined}
                onChange={(v) => field.onChange(v ?? '')}
                maxDate={new Date()}
                placeholder="dd/mm/aaaa"
                aria-invalid={!!form.formState.errors.fecha_nac}
              />
            )} />
            {form.formState.errors.fecha_nac && (
              <FieldError errors={[form.formState.errors.fecha_nac]} />
            )}
          </Field>

          <Field>
            <FieldLabel>Tipo de fecha</FieldLabel>
            {/* Botones con flex-1: se reparten el ancho disponible a partes iguales */}
            <div className="flex rounded-lg border border-input overflow-hidden">
              {(
                [
                  { value: 'real',     label: 'Fecha real' },
                  { value: 'estimada', label: 'Fecha estimada' },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    form.setValue('fecha_nac_tipo', value)
                    form.clearErrors('fecha_nac')
                  }}
                  className={[
                    'flex-1 py-2.5 px-3 text-sm font-medium transition-colors',
                    fechaNacTipo === value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-canvas text-ink-muted hover:bg-surface-alt',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* ── Fila 4: Datos de la compra ───────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Controller name="fecha_compra" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Fecha de compra *</FieldLabel>
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

      </div>

      {/* ── Acciones (fuera de la tarjeta, alineadas a la derecha) ─────────── */}
      <div className="mt-8 flex justify-end items-center gap-4">
        {serverError && (
          <p className="text-sm text-alert mr-auto">{serverError}</p>
        )}
        <Button
          type="button"
          variant="ghost"
          className="h-auto py-3 px-8"
          onClick={() => router.push('/vacuno/animales')}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="h-auto py-3 px-8"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Guardando…' : 'Guardar animal'}
        </Button>
      </div>
    </form>
  )
}
