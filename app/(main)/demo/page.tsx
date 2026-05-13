'use client'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type ColumnDef } from '@tanstack/react-table'
import * as z from 'zod'

import { PageContainer } from '@/components/layout/PageContainer'
import { DataTable } from '@/components/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

// ── Formulario ───────────────────────────────────────────────────────────────

const schema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.').max(50),
  especie: z.string().min(1, 'Selecciona una especie.'),
  observaciones: z.string().max(200, 'Máximo 200 caracteres.').optional(),
  confirmado: z.boolean().refine((val) => val === true, { message: 'Debes confirmar los datos.' }),
})
type FormValues = z.infer<typeof schema>

function FormDemo() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', especie: '', observaciones: '', confirmado: false },
  })

  return (
    <form onSubmit={form.handleSubmit((d) => alert(JSON.stringify(d, null, 2)))} noValidate className="max-w-lg">
      <FieldGroup>
        <Controller name="nombre" control={form.control} render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Nombre del animal</FieldLabel>
            <Input {...field} id={field.name} aria-invalid={fieldState.invalid} placeholder="Ej: Estrella" />
            <FieldDescription>Nombre identificativo del animal.</FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )} />

        <Controller name="especie" control={form.control} render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Especie</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                <SelectValue placeholder="Selecciona una especie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vacuno">Vacuno</SelectItem>
                <SelectItem value="porcino">Porcino</SelectItem>
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )} />

        <Controller name="observaciones" control={form.control} render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Observaciones</FieldLabel>
            <Textarea {...field} id={field.name} aria-invalid={fieldState.invalid} placeholder="Opcionales..." rows={3} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )} />

        <Controller name="confirmado" control={form.control} render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} orientation="horizontal">
            <Checkbox id="confirmado" checked={field.value} onCheckedChange={field.onChange} aria-invalid={fieldState.invalid} />
            <FieldLabel htmlFor="confirmado">Confirmo que los datos son correctos</FieldLabel>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )} />

        <Button type="submit">Guardar</Button>
      </FieldGroup>
    </form>
  )
}

// ── Tabla ────────────────────────────────────────────────────────────────────

type Animal = { id: number; crotal: string; nombre: string; especie: string; peso: number; estado: string }

const animales: Animal[] = [
  { id: 1, crotal: '1234567890123456', nombre: 'Estrella', especie: 'Vacuno', peso: 420, estado: 'Activo' },
  { id: 2, crotal: '1234567890123457', nombre: 'Negra', especie: 'Vacuno', peso: 380, estado: 'Activo' },
  { id: 3, crotal: '1234567890123458', nombre: 'Blanca', especie: 'Porcino', peso: 95, estado: 'Activo' },
  { id: 4, crotal: '1234567890123459', nombre: 'Rubia', especie: 'Vacuno', peso: 510, estado: 'Baja' },
  { id: 5, crotal: '1234567890123460', nombre: 'Canela', especie: 'Porcino', peso: 110, estado: 'Activo' },
  { id: 6, crotal: '1234567890123461', nombre: 'Manchas', especie: 'Vacuno', peso: 460, estado: 'Activo' },
  { id: 7, crotal: '1234567890123462', nombre: 'Luna', especie: 'Porcino', peso: 88, estado: 'Baja' },
  { id: 8, crotal: '1234567890123463', nombre: 'Toro', especie: 'Vacuno', peso: 680, estado: 'Activo' },
  { id: 9, crotal: '1234567890123464', nombre: 'Flaca', especie: 'Porcino', peso: 72, estado: 'Activo' },
  { id: 10, crotal: '1234567890123465', nombre: 'Pinta', especie: 'Vacuno', peso: 395, estado: 'Activo' },
  { id: 11, crotal: '1234567890123466', nombre: 'Morena', especie: 'Vacuno', peso: 440, estado: 'Activo' },
  { id: 12, crotal: '1234567890123467', nombre: 'Gorda', especie: 'Porcino', peso: 130, estado: 'Activo' },
  { id: 13, crotal: '1234567890123468', nombre: 'Pinta', especie: 'Vacuno', peso: 395, estado: 'Activo' },
  { id: 14, crotal: '1234567890123469', nombre: 'Morena', especie: 'Vacuno', peso: 440, estado: 'Activo' },
  { id: 15, crotal: '1234567890123470', nombre: 'Gorda', especie: 'Porcino', peso: 130, estado: 'Activo' },
  { id: 16, crotal: '1234567890123471', nombre: 'Pinta', especie: 'Vacuno', peso: 395, estado: 'Activo' },
  { id: 17, crotal: '1234567890123472', nombre: 'Morena', especie: 'Vacuno', peso: 440, estado: 'Activo' },
  { id: 18, crotal: '1234567890123473', nombre: 'Gorda', especie: 'Porcino', peso: 130, estado: 'Activo' },
  { id: 19, crotal: '1234567890123474', nombre: 'Pinta', especie: 'Vacuno', peso: 395, estado: 'Activo' },
  { id: 20, crotal: '1234567890123475', nombre: 'Morena', especie: 'Vacuno', peso: 440, estado: 'Activo' },
  { id: 21, crotal: '1234567890123476', nombre: 'Gorda', especie: 'Porcino', peso: 130, estado: 'Activo' },
  { id: 22, crotal: '1234567890123477', nombre: 'Pinta', especie: 'Vacuno', peso: 395, estado: 'Activo' },
  { id: 23, crotal: '1234567890123478', nombre: 'Morena', especie: 'Vacuno', peso: 440, estado: 'Activo' },
  { id: 24, crotal: '1234567890123479', nombre: 'Gorda', especie: 'Porcino', peso: 130, estado: 'Activo' },
  { id: 25, crotal: '1234567890123480', nombre: 'Pinta', especie: 'Vacuno', peso: 395, estado: 'Activo' },
  { id: 26, crotal: '1234567890123481', nombre: 'Morena', especie: 'Vacuno', peso: 440, estado: 'Activo' },
  { id: 27, crotal: '1234567890123482', nombre: 'Gorda', especie: 'Porcino', peso: 130, estado: 'Activo' },
  { id: 28, crotal: '1234567890123483', nombre: 'Pinta', especie: 'Vacuno', peso: 395, estado: 'Activo' },
  { id: 29, crotal: '1234567890123484', nombre: 'Morena', especie: 'Vacuno', peso: 440, estado: 'Activo' },
  { id: 30, crotal: '1234567890123485', nombre: 'Gorda', especie: 'Porcino', peso: 130, estado: 'Activo' },
]

const columns: ColumnDef<Animal, unknown>[] = [
  { accessorKey: 'crotal', header: 'Crotal' },
  { accessorKey: 'nombre', header: 'Nombre' },
  { accessorKey: 'especie', header: 'Especie' },
  { accessorKey: 'peso', header: 'Peso (kg)' },
  { accessorKey: 'estado', header: 'Estado' },
]

// ── Página ───────────────────────────────────────────────────────────────────

export default function DemoPage() {
  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-world mb-8">Demo — Componentes base</h1>

      <section className="mb-12">
        <h2 className="text-lg font-semibold text-ink mb-4">Formulario</h2>
        <FormDemo />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-ink mb-4">Tabla</h2>
        <DataTable
          columns={columns}
          data={animales}
          searchColumn="nombre"
          searchPlaceholder="Buscar por nombre..."
          pageSize={5}
        />
      </section>
    </PageContainer>
  )
}
