'use client'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CheckCircle2 } from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EstadoVitalBadge } from '@/modules/ganadero/animales/ui/ficha/EstadosBadges'
import { formatFecha } from '@/lib/format'
import { submitIdentificarAnimal } from '@/app/(main)/vacuno/animales/[id]/actions'
import { isValidCrotalFormat } from '@/modules/ganadero/animales/domain/IdentificationRules'
import type { ISODate } from '@/modules/shared/types'
import type { Sexo, EstadoVital, EstadoIdentificacion } from '@/modules/ganadero/shared/domain/types'
import type { AnimalIdentificationStatus } from '@/modules/ganadero/animales/domain/IdentificationRules'

// ── Schema ────────────────────────────────────────────────────────────────────
// crotal es opcional; si se rellena, debe tener el formato oficial (2 letras país + 12 dígitos).

const schema = z.object({
  crotal: z.string()
    .refine(
      (val) => !val || isValidCrotalFormat(val),
      { message: 'Formato inválido. Usa 2 letras de país + 12 dígitos (ej. ES123456789012)' },
    )
    .optional(),
  sexo:   z.enum(['macho', 'hembra', '']).optional(),
})

type FormValues = z.infer<typeof schema>

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  animalId:              string
  // Campos editables (criterios de identificación)
  crotal:                string | null
  sexo:                  Sexo
  estado_identificacion: EstadoIdentificacion | null
  // Información del nacimiento (solo lectura)
  fecha_nacimiento:      ISODate | null
  madre_crotal:          string | null
  padre_crotal:          string | null
  raza_nombre:           string | null
  estado_vital:          EstadoVital
  // Control del sheet
  open:                  boolean
  onOpenChange:          (open: boolean) => void
  onSuccess:             (status: AnimalIdentificationStatus) => void
}

// ── Fila de solo lectura ──────────────────────────────────────────────────────

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-divider last:border-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-sm text-ink font-medium">{children}</span>
    </div>
  )
}

// ── Componente ────────────────────────────────────────────────────────────────

export function DrawerIdentificacion({
  animalId,
  crotal,
  sexo,
  estado_identificacion,
  fecha_nacimiento,
  madre_crotal,
  padre_crotal,
  raza_nombre,
  estado_vital,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [serverError,  setServerError]  = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // null = no guardado aún; AnimalIdentificationStatus = resultado del último guardado
  const [savedStatus, setSavedStatus] = useState<AnimalIdentificationStatus | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    // values (no defaultValues) para sincronizar si las props cambian entre aperturas
    values: {
      crotal: crotal ?? '',
      sexo:   (sexo ?? '') as 'macho' | 'hembra' | '',
    },
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setServerError(null)

    const result = await submitIdentificarAnimal(animalId, {
      crotal: values.crotal || undefined,
      sexo:   (values.sexo as 'macho' | 'hembra') || undefined,
    })

    setIsSubmitting(false)

    if ('error' in result) {
      setServerError(result.error)
      return
    }

    setSavedStatus(result.status)
    onSuccess(result.status)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setServerError(null)
      setSavedStatus(null)
      form.reset()
    }
    onOpenChange(nextOpen)
  }

  const guardadoCompleto = savedStatus?.estado === 'completa'

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Completar identificación</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="flex-1 space-y-6 px-5 py-5">

            {/* ── Información del nacimiento (solo lectura) ────────────── */}
            <div>
              <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                Información del nacimiento
              </h3>
              <div className="rounded-lg border border-divider px-4">
                <InfoRow label="Fecha">
                  {fecha_nacimiento ? formatFecha(fecha_nacimiento) : '—'}
                </InfoRow>
                <InfoRow label="Madre">
                  {madre_crotal ?? '—'}
                </InfoRow>
                <InfoRow label="Padre">
                  {padre_crotal ?? '—'}
                </InfoRow>
                <InfoRow label="Raza">
                  {raza_nombre ?? '—'}
                </InfoRow>
                <InfoRow label="Estado vital">
                  <EstadoVitalBadge estado={estado_vital} />
                </InfoRow>
              </div>
            </div>

            {/* ── Información pendiente de completar ──────────────────── */}
            {!guardadoCompleto && (
              <div>
                <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
                  Información pendiente de completar
                </h3>
                <form
                  id="form-identificacion"
                  onSubmit={form.handleSubmit(onSubmit)}
                  noValidate
                  className="space-y-4"
                >
                  <Controller name="crotal" control={form.control} render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Crotal</FieldLabel>
                      <Input
                        {...field}
                        placeholder="Ej. ES123456789012"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )} />

                  <Controller name="sexo" control={form.control} render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Sexo</FieldLabel>
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                          <SelectValue placeholder="Sin determinar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sin determinar</SelectItem>
                          <SelectItem value="macho">Macho</SelectItem>
                          <SelectItem value="hembra">Hembra</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )} />
                </form>
              </div>
            )}

            {/* ── Resultado tras guardar ───────────────────────────────── */}
            {guardadoCompleto && (
              <div className="flex items-center gap-3 rounded-lg border border-success bg-success-soft px-4 py-4">
                <CheckCircle2 className="size-5 text-success flex-shrink-0" />
                <span className="text-sm font-medium text-success">
                  Identificación completada
                </span>
              </div>
            )}

            {savedStatus && !guardadoCompleto && (
              <div className="rounded-lg border border-divider bg-surface-alt px-4 py-3 space-y-1">
                <p className="text-sm text-ink-muted">Datos guardados. Criterios pendientes:</p>
                <ul className="space-y-0.5 text-xs text-ink-muted">
                  {savedStatus.criteriosFaltantes.map(c => (
                    <li key={c}>· {c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <SheetFooter>
            {serverError && (
              <p className="text-sm text-alert mr-auto">{serverError}</p>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {guardadoCompleto ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!guardadoCompleto && (
              <Button
                type="submit"
                form="form-identificacion"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando…' : 'Guardar'}
              </Button>
            )}
          </SheetFooter>
        </div>

      </SheetContent>
    </Sheet>
  )
}
