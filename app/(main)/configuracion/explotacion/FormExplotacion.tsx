'use client'

import { useEffect, useState, useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import * as z from 'zod'
import dynamic from 'next/dynamic'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ImageUploadCropper } from '@/components/ui/image-upload-cropper'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import { submitActualizarExplotacion } from './actions'
import type { Explotacion } from '@/modules/ganadero/explotacion/domain/types'

// Leaflet requiere window; cargamos con ssr:false
const SelectorCoordenadas = dynamic(
  () => import('@/modules/ganadero/instalaciones/ui/mapa/SelectorCoordenadas'),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: '200px' }} className="flex items-center justify-center rounded-lg border border-divider bg-stone-50 dark:bg-stone-900/30">
        <span className="text-sm text-ink-muted">Cargando mapa…</span>
      </div>
    ),
  }
)

function InfoPopover({ content }: { content: string }) {
  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex items-center justify-center text-ink-muted/50 hover:text-ink-muted transition-colors cursor-pointer"
        aria-label="Más información"
      >
        <Info className="h-3.5 w-3.5" />
      </PopoverTrigger>
      <PopoverContent side="top" sideOffset={6} align="start" className="w-56 p-3">
        <p className="text-xs text-ink-muted leading-relaxed">{content}</p>
      </PopoverContent>
    </Popover>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-bold text-ink-muted uppercase tracking-widest whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-divider/60" />
    </div>
  )
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const schema = z.object({
  nombre:            z.string().min(1, 'El nombre es obligatorio'),
  nombre_comercial:  z.string().optional(),
  email:             z.string().email('Email no válido').or(z.literal('')).optional(),
  telefono:          z.string().optional(),
  direccion:         z.string().optional(),
  codigo_postal:     z.string().optional(),
  municipio:         z.string().optional(),
  provincia:         z.string().optional(),
  pais:              z.string().optional(),
  latitud:           z.string().optional(),
  longitud:          z.string().optional(),
  logo_storage_path: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function buildDefaults(e: Explotacion | null): FormValues {
  return {
    nombre:            e?.nombre            ?? '',
    nombre_comercial:  e?.nombre_comercial  ?? '',
    email:             e?.email             ?? '',
    telefono:          e?.telefono          ?? '',
    direccion:         e?.direccion         ?? '',
    codigo_postal:     e?.codigo_postal     ?? '',
    municipio:         e?.municipio         ?? '',
    provincia:         e?.provincia         ?? '',
    pais:              e?.pais              ?? '',
    latitud:           e?.latitud  != null  ? String(e.latitud)  : '',
    longitud:          e?.longitud != null  ? String(e.longitud) : '',
    logo_storage_path: e?.logo_storage_path ?? '',
  }
}

function emptyToNull(v: string | undefined): string | null {
  return v && v.trim() !== '' ? v.trim() : null
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  explotacion: Explotacion | null
}

export function FormExplotacion({ explotacion }: Props) {
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(explotacion),
  })

  // Sincroniza si el servidor revalida y el componente se vuelve a montar con datos frescos
  useEffect(() => {
    form.reset(buildDefaults(explotacion))
  // explotacion?.id detecta cambio de la entidad
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explotacion?.id])

  // URL pública del logo con updated_at como cache-buster: fuerza recarga cuando el logo cambia
  const logoPath = form.watch('logo_storage_path') || explotacion?.logo_storage_path
  const currentLogoUrl = logoPath
    ? `${createClient().storage.from('images').getPublicUrl(logoPath).data.publicUrl}?v=${encodeURIComponent(explotacion?.updated_at ?? '')}`
    : undefined

  function onSubmit(values: FormValues) {
    if (!explotacion) return
    setServerError(null)

    const lat = parseFloat(values.latitud ?? '')
    const lng = parseFloat(values.longitud ?? '')

    startTransition(async () => {
      const result = await submitActualizarExplotacion({
        id:                explotacion.id,
        nombre:            values.nombre.trim(),
        nombre_comercial:  emptyToNull(values.nombre_comercial),
        email:             emptyToNull(values.email),
        telefono:          emptyToNull(values.telefono),
        direccion:         emptyToNull(values.direccion),
        codigo_postal:     emptyToNull(values.codigo_postal),
        municipio:         emptyToNull(values.municipio),
        provincia:         emptyToNull(values.provincia),
        pais:              emptyToNull(values.pais),
        latitud:           !isNaN(lat) ? lat : null,
        longitud:          !isNaN(lng) ? lng : null,
        logo_storage_path: emptyToNull(values.logo_storage_path),
      })

      if (result?.error) {
        setServerError(result.error)
        return
      }
      toast.success('Datos guardados')
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">

      {/* ── Título ────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-world">Datos de la explotación</h1>
        <p className="text-sm text-ink-muted mt-1">
          Información general, contacto, dirección y logotipo de la explotación.
        </p>
      </div>

      {/* Contenido en card para consistencia visual con el resto de la app */}
      <div className="bg-canvas rounded-xl border border-divider/30 shadow-sm p-6 md:p-8 max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-8">

      {/* ── Identidad ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <SectionTitle>Identidad</SectionTitle>

        <Field>
          <FieldLabel>Nombre <span className="text-alert">*</span></FieldLabel>
          <Input
            {...form.register('nombre')}
            placeholder="Hermanos Rodríguez"
            aria-invalid={!!form.formState.errors.nombre}
          />
          <FieldError errors={[form.formState.errors.nombre]} />
        </Field>

        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel>Nombre comercial</FieldLabel>
            <InfoPopover content="Nombre que aparecerá en documentos comerciales si es distinto al nombre oficial." />
          </div>
          <Input {...form.register('nombre_comercial')} placeholder="Ganadería Rodríguez" />
        </Field>
      </div>

      {/* ── Contacto ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <SectionTitle>Contacto</SectionTitle>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input
              {...form.register('email')}
              type="email"
              placeholder="contacto@explotacion.com"
              aria-invalid={!!form.formState.errors.email}
            />
            <FieldError errors={[form.formState.errors.email]} />
          </Field>
          <Field>
            <FieldLabel>Teléfono</FieldLabel>
            <Input {...form.register('telefono')} placeholder="+34 600 000 000" />
          </Field>
        </div>
      </div>

      {/* ── Dirección ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <SectionTitle>Dirección</SectionTitle>

        <Field>
          <FieldLabel>Dirección</FieldLabel>
          <Input {...form.register('direccion')} placeholder="Calle Mayor, 1" />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field>
            <FieldLabel>C.P.</FieldLabel>
            <Input {...form.register('codigo_postal')} placeholder="37001" />
          </Field>
          <Field className="col-span-2">
            <FieldLabel>Municipio</FieldLabel>
            <Input {...form.register('municipio')} placeholder="Salamanca" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Provincia</FieldLabel>
            <Input {...form.register('provincia')} placeholder="Salamanca" />
          </Field>
          <Field>
            <FieldLabel>País</FieldLabel>
            <Input {...form.register('pais')} placeholder="España" />
          </Field>
        </div>
      </div>

      {/* ── Ubicación ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <SectionTitle>Ubicación</SectionTitle>

        <p className="text-xs text-ink-muted/70">
          Ubica la explotación en el mapa para facilitar la gestión de instalaciones y desplazamientos.
          Estas coordenadas corresponden a la ubicación física de las instalaciones ganaderas,
          no necesariamente a la dirección fiscal indicada arriba.
        </p>

        {/* isolation:isolate crea un stacking context que contiene los z-index internos de Leaflet (400+)
            y evita que se superpongan con el header fijo (z-40) al hacer scroll */}
        <div style={{ height: '300px', isolation: 'isolate' }} className="rounded-lg overflow-hidden border border-divider">
          <SelectorCoordenadas
            lat={explotacion?.latitud ?? undefined}
            lng={explotacion?.longitud ?? undefined}
            onChange={(lat, lng) => {
              form.setValue('latitud', lat.toFixed(6))
              form.setValue('longitud', lng.toFixed(6))
            }}
          />
        </div>
        <p className="text-xs text-ink-muted/60">
          Haz clic en el mapa o arrastra el marcador para fijar las coordenadas.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Latitud</FieldLabel>
            <Input {...form.register('latitud')} placeholder="40.913857" inputMode="decimal" />
          </Field>
          <Field>
            <FieldLabel>Longitud</FieldLabel>
            <Input {...form.register('longitud')} placeholder="-6.204804" inputMode="decimal" />
          </Field>
        </div>
      </div>

      {/* ── Identidad visual ──────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <SectionTitle>Identidad visual</SectionTitle>

        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel>Logo</FieldLabel>
            <InfoPopover content="Se mostrará en el sidebar y en la página de acceso. Formato cuadrado recomendado." />
          </div>
          <Controller
            control={form.control}
            name="logo_storage_path"
            render={() => (
              <ImageUploadCropper
                aspectRatio="square"
                storageBucket="images"
                storagePath="explotacion/logo"
                currentUrl={currentLogoUrl}
                outputSizePx={512}
                onUploadComplete={(path) => form.setValue('logo_storage_path', path, { shouldDirty: true })}
              />
            )}
          />
        </Field>
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      {serverError && (
        <p role="alert" className="text-sm text-alert">{serverError}</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>

      </div>
      </div>
    </form>
  )
}
