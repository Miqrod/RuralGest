'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { submitCrearInstalacion, submitActualizarInstalacion } from './actions'
import type { InstalacionListItem } from '@/modules/ganadero/instalaciones/domain/types'

const TIPOS = [
  { value: 'corral',   label: 'Corral' },
  { value: 'nave',     label: 'Nave' },
  { value: 'prado',    label: 'Prado' },
  { value: 'cercado',  label: 'Cercado' },
  { value: 'almacen',  label: 'Almacén' },
  { value: 'otro',     label: 'Otro' },
] as const

const schema = z.object({
  nombre:          z.string().min(1, 'El nombre es obligatorio.'),
  tipo:            z.enum(['corral', 'nave', 'prado', 'cercado', 'almacen', 'otro'], { message: 'Selecciona un tipo.' }),
  admite_animales: z.boolean(),
  admite_stock:    z.boolean(),
  observaciones:   z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  // undefined = modo creación; definido = modo edición
  instalacion?: InstalacionListItem
}

export function FormInstalacion({ open, onOpenChange, instalacion }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const isEdit = instalacion !== undefined

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre:          instalacion?.nombre          ?? '',
      tipo:            instalacion?.tipo            ?? ('' as FormValues['tipo']),
      admite_animales: instalacion?.admite_animales ?? true,
      admite_stock:    instalacion?.admite_stock    ?? false,
      observaciones:   '',
    },
  })

  // Sincroniza los valores del formulario cuando cambia la instalación seleccionada
  // (el usuario abre el dialog de edición para una instalación diferente).
  const { reset } = form
  if (open && instalacion && form.getValues('nombre') !== instalacion.nombre) {
    reset({
      nombre:          instalacion.nombre,
      tipo:            instalacion.tipo,
      admite_animales: instalacion.admite_animales,
      admite_stock:    instalacion.admite_stock,
      observaciones:   '',
    })
  }

  function handleClose() {
    onOpenChange(false)
    setServerError(null)
    if (!isEdit) form.reset()
  }

  function onSubmit(values: FormValues) {
    setServerError(null)
    startTransition(async () => {
      let result: { error: string } | null

      if (isEdit) {
        result = await submitActualizarInstalacion(
          { id: instalacion.id, nombre: values.nombre, tipo: values.tipo, observaciones: values.observaciones ?? null },
          { id: instalacion.id, admite_animales: values.admite_animales, admite_stock: values.admite_stock },
        )
      } else {
        result = await submitCrearInstalacion({
          nombre:          values.nombre,
          tipo:            values.tipo,
          admite_animales: values.admite_animales,
          admite_stock:    values.admite_stock,
          observaciones:   values.observaciones,
        })
      }

      if (result?.error) {
        setServerError(result.error)
        return
      }

      toast.success(isEdit ? 'Instalación actualizada' : 'Instalación creada')
      handleClose()
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar instalación' : 'Nueva instalación'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Nombre */}
          <Field>
            <FieldLabel>Nombre</FieldLabel>
            <Input
              {...form.register('nombre')}
              placeholder="Ej: Corral Norte"
              aria-invalid={!!form.formState.errors.nombre}
            />
            <FieldError errors={[form.formState.errors.nombre]} />
          </Field>

          {/* Tipo */}
          <Field>
            <FieldLabel>Tipo</FieldLabel>
            <Controller
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-invalid={!!form.formState.errors.tipo}>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[form.formState.errors.tipo]} />
          </Field>

          {/* Usos */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium mb-1">Usos admitidos</legend>
            <Controller
              control={form.control}
              name="admite_animales"
              render={({ field }) => (
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  Animales — válida como destino de reubicación
                </label>
              )}
            />
            <Controller
              control={form.control}
              name="admite_stock"
              render={({ field }) => (
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  Stock físico — paja, pienso, medicamentos, etc.
                </label>
              )}
            />
          </fieldset>

          {/* Observaciones */}
          <Field>
            <FieldLabel>Observaciones <span className="text-ink-muted font-normal">(opcional)</span></FieldLabel>
            <Textarea
              {...form.register('observaciones')}
              placeholder="Notas sobre esta instalación..."
              rows={2}
            />
          </Field>

          {serverError && (
            <p role="alert" className="text-sm text-destructive">{serverError}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear instalación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
