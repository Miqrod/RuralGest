'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import * as z from 'zod'
import dynamic from 'next/dynamic'
import { AlertTriangle, Info } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  submitCrearInstalacion, submitActualizarInstalacion,
  submitActivarInstalacion, submitDesactivarInstalacion,
} from './actions'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import type { InstalacionListItem } from '@/modules/ganadero/instalaciones/domain/types'
import { cn } from '@/lib/utils'

// ssr: false — Leaflet requiere window; el drawer ya es Client Component
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

const TIPOS = [
  { value: 'corral',  label: 'Corral' },
  { value: 'nave',    label: 'Nave' },
  { value: 'prado',   label: 'Prado' },
  { value: 'cercado', label: 'Cercado' },
  { value: 'almacen', label: 'Almacén' },
  { value: 'otro',    label: 'Otro' },
] as const

const schema = z.object({
  nombre:          z.string().min(1, 'El nombre es obligatorio.'),
  tipo:            z.enum(['corral', 'nave', 'prado', 'cercado', 'almacen', 'otro'], { message: 'Selecciona un tipo.' }),
  activo:          z.boolean(),
  admite_animales: z.boolean(),
  admite_stock:    z.boolean(),
  coordenadas_lat: z.string().optional(),
  coordenadas_lng: z.string().optional(),
  observaciones:   z.string().optional(),
  // Confirmación explícita cuando se desactiva "admite_animales" con animales presentes
  confirmar_desactivar_animales: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

function buildDefaults(instalacion?: InstalacionListItem): FormValues {
  return {
    nombre:          instalacion?.nombre          ?? '',
    tipo:            instalacion?.tipo            ?? ('' as FormValues['tipo']),
    activo:          instalacion?.activo          ?? true,
    admite_animales: instalacion?.admite_animales ?? true,
    admite_stock:    instalacion?.admite_stock    ?? false,
    coordenadas_lat: instalacion?.coordenadas     ? String(instalacion.coordenadas.lat) : '',
    coordenadas_lng: instalacion?.coordenadas     ? String(instalacion.coordenadas.lng) : '',
    observaciones:   instalacion?.observaciones ?? '',
    confirmar_desactivar_animales: false,
  }
}

function parseCoords(lat?: string, lng?: string): { lat: number; lng: number } | null {
  const la = parseFloat(lat ?? '')
  const lo = parseFloat(lng ?? '')
  if (isNaN(la) || isNaN(lo)) return null
  return { lat: la, lng: lo }
}

// Icono de información con popover — funciona en hover y en tap (móvil)
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

// Encabezado de sección con línea separadora
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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  // undefined = modo creación; definido = modo edición
  instalacion?: InstalacionListItem
}

export function DrawerInstalacion({ open, onOpenChange, instalacion }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  // Dialog de bloqueo: instalación con animales → no se puede desactivar
  const [showBloqueoAnimales, setShowBloqueoAnimales] = useState(false)
  // Dialog de confirmación: sin animales, confirmar antes de desactivar
  const [showConfirmDesactivar, setShowConfirmDesactivar] = useState(false)
  // Valores del formulario pendientes de enviar tras confirmación
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null)

  const isEdit     = instalacion !== undefined
  const numAnimales = instalacion?.num_animales ?? 0

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(instalacion),
  })

  // Sincroniza valores cuando el drawer se abre o cambia la instalación seleccionada.
  // Fuera del render (useEffect) para no disparar setState de Controller durante un render activo.
  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(instalacion))
    }
  // instalacion?.id detecta cambio de instalación; open detecta apertura del drawer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, instalacion?.id])

  const watchActivo          = form.watch('activo')
  const watchAdmiteAnimales  = form.watch('admite_animales')
  const watchConfirmar       = form.watch('confirmar_desactivar_animales')

  // Warning inline: se intenta desactivar admite_animales con animales en esta instalación
  const showAnimalesWarning =
    isEdit &&
    instalacion!.admite_animales &&
    !watchAdmiteAnimales &&
    numAnimales > 0

  function handleClose() {
    onOpenChange(false)
    setServerError(null)
    form.reset(buildDefaults(undefined))
  }

  function handleActivoChange(newActivo: boolean) {
    if (!newActivo && isEdit && numAnimales > 0) {
      // Tiene animales: mostrar bloqueo sin modificar el formulario
      setShowBloqueoAnimales(true)
      return
    }
    form.setValue('activo', newActivo)
  }

  async function executeSubmit(values: FormValues) {
    const coords = parseCoords(values.coordenadas_lat, values.coordenadas_lng)
    let result: { error: string } | null = null

    if (isEdit) {
      const id = instalacion!.id

      // Cambio de estado procesado de forma independiente
      if (values.activo !== instalacion!.activo) {
        result = values.activo
          ? await submitActivarInstalacion(id)
          : await submitDesactivarInstalacion(id)
        if (result?.error) { setServerError(result.error); return }
        result = null
      }

      result = await submitActualizarInstalacion(
        { id, nombre: values.nombre, tipo: values.tipo, coordenadas: coords, observaciones: values.observaciones || null },
        { id, admite_animales: values.admite_animales, admite_stock: values.admite_stock },
      )
    } else {
      result = await submitCrearInstalacion({
        nombre:          values.nombre,
        tipo:            values.tipo,
        admite_animales: values.admite_animales,
        admite_stock:    values.admite_stock,
        coordenadas:     coords ?? undefined,
        observaciones:   values.observaciones || undefined,
      })
    }

    if (result?.error) { setServerError(result.error); return }

    toast.success(isEdit ? 'Instalación actualizada' : 'Instalación creada')
    handleClose()
    router.refresh()
  }

  function onSubmit(values: FormValues) {
    setServerError(null)

    // Si va a desactivar una instalación activa, pedir confirmación primero
    if (isEdit && instalacion!.activo && !values.activo) {
      setPendingValues(values)
      setShowConfirmDesactivar(true)
      return
    }

    startTransition(async () => { await executeSubmit(values) })
  }

  function handleConfirmDesactivar() {
    setShowConfirmDesactivar(false)
    if (!pendingValues) return
    const values = pendingValues
    setPendingValues(null)
    startTransition(async () => { await executeSubmit(values) })
  }

  const guardarDeshabilitado =
    pending || (showAnimalesWarning && !watchConfirmar)

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {isEdit ? 'Editar instalación' : 'Nueva instalación'}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6">
            {/* ── Datos básicos ─────────────────────────────────── */}
            <div className="flex flex-col gap-4">
              <SectionTitle>Datos básicos</SectionTitle>

              <Field>
                <FieldLabel>Nombre</FieldLabel>
                <Input
                  {...form.register('nombre')}
                  placeholder="Ej: Corral Norte"
                  aria-invalid={!!form.formState.errors.nombre}
                />
                <FieldError errors={[form.formState.errors.nombre]} />
              </Field>

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
            </div>

            {/* ── Estado (solo en edición) ───────────────────────── */}
            {isEdit && (
              <div className="flex flex-col gap-3">
                <SectionTitle>Estado</SectionTitle>
                <div className="flex gap-3">
                  <label className={cn(
                    'flex-1 flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors select-none',
                    watchActivo
                      ? 'border-world bg-success-soft'
                      : 'border-divider bg-surface-alt',
                  )}>
                    <input
                      type="radio"
                      name="activo-radio"
                      checked={watchActivo}
                      onChange={() => handleActivoChange(true)}
                      style={{ accentColor: 'var(--color-world)' }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium">Activa</span>
                  </label>
                  <label className={cn(
                    'flex-1 flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors select-none',
                    !watchActivo
                      ? 'border-alert bg-alert-soft'
                      : 'border-divider bg-surface-alt',
                  )}>
                    <input
                      type="radio"
                      name="activo-radio"
                      checked={!watchActivo}
                      onChange={() => handleActivoChange(false)}
                      style={{ accentColor: 'var(--color-alert)' }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium">Inactiva</span>
                  </label>
                </div>
              </div>
            )}

            {/* ── Usos operativos ───────────────────────────────── */}
            <div className="flex flex-col gap-3">
              <SectionTitle>Usos operativos</SectionTitle>

              <p className="text-xs text-ink-muted/70 leading-relaxed">
                Estos valores determinan qué operaciones pueden realizarse sobre esta instalación.
              </p>

              <div className="flex items-center gap-2">
                <Controller
                  control={form.control}
                  name="admite_animales"
                  render={({ field }) => (
                    <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      Admite animales
                    </label>
                  )}
                />
                <InfoPopover content="Permite usar esta instalación como destino en reubicaciones de animales." />
              </div>

              <div className="flex items-center gap-2">
                <Controller
                  control={form.control}
                  name="admite_stock"
                  render={({ field }) => (
                    <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      Admite stock
                    </label>
                  )}
                />
                <InfoPopover content="Permite registrar stock físico en esta instalación: paja, pienso, medicamentos y similares." />
              </div>

              {/* Warning inline: desactivar admite_animales con animales presentes */}
              {showAnimalesWarning && (
                <div className="rounded-lg border border-warning bg-warning-soft p-3 flex flex-col gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold text-warning">
                        Esta instalación tiene actualmente {numAnimales} {numAnimales === 1 ? 'animal' : 'animales'}.
                      </p>
                      <p className="text-sm text-warning/90">
                        Desactivar esta opción impedirá añadir nuevos animales a esta ubicación.
                      </p>
                      <p className="text-sm text-warning/90">
                        Los animales actuales permanecerán en esta instalación.
                      </p>
                    </div>
                  </div>
                  <Controller
                    control={form.control}
                    name="confirmar_desactivar_animales"
                    render={({ field }) => (
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-divider"
                          style={{ accentColor: 'var(--color-warning)' }}
                          checked={field.value ?? false}
                          onChange={e => field.onChange(e.target.checked)}
                        />
                        <span className="text-xs text-warning/90 leading-snug">
                          Entendido, desactivar igualmente
                        </span>
                      </label>
                    )}
                  />
                </div>
              )}
            </div>

            {/* ── Ubicación ─────────────────────────────────────── */}
            <div className="flex flex-col gap-3">
              <SectionTitle>Ubicación</SectionTitle>

              {/* Mapa interactivo — click para colocar, arrastrar para ajustar.
                  key fuerza remontaje al abrir/cambiar instalación, tomando coords frescas */}
              <div style={{ height: '200px' }} className="rounded-lg overflow-hidden border border-divider">
                <SelectorCoordenadas
                  key={`${open}-${instalacion?.id ?? 'new'}`}
                  lat={instalacion?.coordenadas?.lat}
                  lng={instalacion?.coordenadas?.lng}
                  onChange={(lat, lng) => {
                    form.setValue('coordenadas_lat', lat.toFixed(6))
                    form.setValue('coordenadas_lng', lng.toFixed(6))
                  }}
                />
              </div>
              <p className="text-xs text-ink-muted/60">
                Haz clic en el mapa o arrastra el marcador para fijar las coordenadas.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Latitud</FieldLabel>
                  <Input
                    {...form.register('coordenadas_lat')}
                    placeholder="40.913857"
                    inputMode="decimal"
                  />
                </Field>
                <Field>
                  <FieldLabel>Longitud</FieldLabel>
                  <Input
                    {...form.register('coordenadas_lng')}
                    placeholder="-6.204804"
                    inputMode="decimal"
                  />
                </Field>
              </div>
            </div>

            {/* ── Observaciones ─────────────────────────────────── */}
            <div className="flex flex-col gap-3">
              <SectionTitle>Observaciones</SectionTitle>
              {/* Controller en lugar de register: Textarea no hace forwardRef,
                  así RHF lee el valor desde estado interno en lugar del ref del DOM */}
              <Controller
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <Textarea
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Notas sobre esta instalación..."
                    rows={3}
                  />
                )}
              />
            </div>

            {serverError && (
              <p role="alert" className="text-sm text-alert">{serverError}</p>
            )}
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={pending}>
              Cancelar
            </Button>
            <Button
              onClick={() => form.handleSubmit(onSubmit)()}
              disabled={guardarDeshabilitado}
            >
              {pending ? 'Guardando…' : 'Guardar'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Dialog: instalación con animales → no se puede desactivar */}
      <AlertDialog open={showBloqueoAnimales} onOpenChange={setShowBloqueoAnimales}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>No se puede desactivar esta instalación</AlertDialogTitle>
            <AlertDialogDescription>
              Esta instalación tiene actualmente{' '}
              <strong>{numAnimales} {numAnimales === 1 ? 'animal' : 'animales'}</strong>.
              {' '}Reubica primero los animales antes de desactivarla.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowBloqueoAnimales(false)}>
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: confirmar desactivación cuando no hay animales */}
      <AlertDialog
        open={showConfirmDesactivar}
        onOpenChange={(o) => { if (!o) { setShowConfirmDesactivar(false); setPendingValues(null) } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar instalación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se desactivará <strong>&ldquo;{instalacion?.nombre}&rdquo;</strong>.
              No podrá usarse como destino de reubicación mientras esté inactiva.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowConfirmDesactivar(false)
              setPendingValues(null)
              // Revertir el radio a Activa ya que el usuario ha cancelado
              form.setValue('activo', true)
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDesactivar}
              disabled={pending}
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
