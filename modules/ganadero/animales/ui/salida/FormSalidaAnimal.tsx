'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { submitVentaAnimal, submitMuerteAnimal } from '@/app/(main)/vacuno/animales/[id]/actions'

// ── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  motivo: z.enum(['venta', 'muerte'], { message: 'Selecciona el motivo de salida.' }),
  fecha:  z.string().min(1, 'La fecha es obligatoria.'),
})

type FormValues = z.infer<typeof schema>

// ── Constantes ───────────────────────────────────────────────────────────────

const FECHA_LABEL: Record<'venta' | 'muerte', string> = {
  venta:  'Fecha de venta',
  muerte: 'Fecha de fallecimiento',
}

const MOTIVO_LABEL: Record<'venta' | 'muerte', string> = {
  venta:  'venta',
  muerte: 'muerte',
}

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  animalId:  string
  crotal?:   string | null
  onSuccess: () => void
  onCancel:  () => void
}

// ── Componente ───────────────────────────────────────────────────────────────

export function FormSalidaAnimal({ animalId, crotal, onSuccess, onCancel }: Props) {
  const [serverError,   setServerError]   = useState<string | null>(null)
  // pendingValues: valores validados que esperan confirmación en el dialog
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null)
  const [isConfirming,  setIsConfirming]  = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      motivo: '' as 'venta' | 'muerte',
      fecha:  '',
    },
  })

  const motivo = form.watch('motivo')

  // El submit del formulario solo valida y abre el diálogo — no llama al servidor.
  function onValidSubmit(values: FormValues) {
    setServerError(null)
    setPendingValues(values)
  }

  // El botón "Confirmar" del diálogo es quien realmente ejecuta la acción.
  async function onConfirm() {
    if (!pendingValues) return
    setIsConfirming(true)
    setServerError(null)

    const result = pendingValues.motivo === 'venta'
      ? await submitVentaAnimal(animalId, pendingValues.fecha)
      : await submitMuerteAnimal(animalId, pendingValues.fecha)

    setIsConfirming(false)
    setPendingValues(null)

    if (result?.error) {
      setServerError(result.error)
      toast.error(result.error)
      return
    }
    onSuccess()
  }

  const identificador = crotal ? `el animal con crotal ${crotal}` : 'este animal'

  return (
    <>
      <form onSubmit={form.handleSubmit(onValidSubmit)} noValidate className="space-y-6">

        {/* Fila 1: motivo — siempre visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Controller name="motivo" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Motivo de salida *</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Selecciona el motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="venta">Venta</SelectItem>
                  <SelectItem value="muerte">Muerte</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />
        </div>

        {/* Fila 2: fecha — aparece cuando hay motivo seleccionado */}
        <AnimatePresence initial={false}>
          {motivo ? (
            <motion.div
              key="fecha-field"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <Controller name="fecha" control={form.control} render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{FECHA_LABEL[motivo]} *</FieldLabel>
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
            </motion.div>
          ) : null}
        </AnimatePresence>

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
          <Button
            type="submit"
            className="h-auto py-2 px-6"
            disabled={!motivo}
          >
            Continuar
          </Button>
        </div>

      </form>

      {/* Diálogo de confirmación: se abre tras validar el formulario, antes de persistir */}
      <AlertDialog open={pendingValues !== null}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader className="place-items-center text-center py-3">
            <AlertDialogTitle className="text-lg text-alert text-center">
              ¿Confirmar {pendingValues ? MOTIVO_LABEL[pendingValues.motivo] : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Vas a registrar la {pendingValues ? MOTIVO_LABEL[pendingValues.motivo] : ''} de{' '}
              <strong>{identificador}</strong>.<br />
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="h-auto py-2 px-6"
              onClick={() => setPendingValues(null)}
            >
              Volver
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-auto py-2 px-6 bg-alert hover:bg-alert/90 text-white border-transparent"
              disabled={isConfirming}
              onClick={onConfirm}
            >
              {isConfirming ? 'Guardando…' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
