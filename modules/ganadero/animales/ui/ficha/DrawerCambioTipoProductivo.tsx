'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { submitCambiarTipoProductivo } from '@/app/(main)/vacuno/animales/[id]/actions'
import type { TipoProductivoOption } from '@/modules/ganadero/animales/application/queries/listarTiposProductivos'
import type { EstadoReproductivo } from '@/modules/ganadero/shared/domain/types'
import type { UUID } from '@/modules/shared/types'

interface Props {
  animalId:           UUID
  tipoActualNombre:   string | null
  estadoReproductivo: EstadoReproductivo | null
  tiposDisponibles:   TipoProductivoOption[]
  open:               boolean
  onOpenChange:       (open: boolean) => void
}

// Mensajes contextuales según el estado reproductivo al salir de Reproductora.
//
//   gestante → bloqueo total: el cambio no está permitido. El mensaje explica por qué.
//   cubierta → advertencia + confirmación obligatoria: el ciclo se cerrará.
//   vacia    → advertencia informativa: el ciclo se cerrará.
//
// El caller usa `estadoReproductivo === 'gestante'` para decidir si mostrar
// el formulario o solo el mensaje de bloqueo con un único botón de cerrar.
function getMensajeContextual(
  tipoNuevoNombre: string | undefined,
  tipoActualNombre: string | null,
  estadoReproductivo: EstadoReproductivo | null,
): { texto: string; tipo: 'bloqueo' | 'aviso' } | null {
  const esSalidaDeReproductora =
    tipoActualNombre === 'Reproductora' && tipoNuevoNombre !== 'Reproductora'

  // Gestante se muestra aunque no haya tipo seleccionado aún: el bloqueo es absoluto.
  if (tipoActualNombre === 'Reproductora' && estadoReproductivo === 'gestante') {
    return {
      tipo: 'bloqueo',
      texto: 'No es posible cambiar el tipo productivo durante una gestación en curso. Registra el parto o aborto del ciclo actual para poder realizar este cambio.',
    }
  }

  if (!esSalidaDeReproductora || !estadoReproductivo) return null

  if (estadoReproductivo === 'cubierta') {
    return {
      tipo: 'aviso',
      texto: 'Este animal tiene una cubrición registrada. Al cambiar de tipo, el ciclo se cerrará y la cubrición quedará sin desenlace.',
    }
  }
  if (estadoReproductivo === 'vacia') {
    return {
      tipo: 'aviso',
      texto: 'Este animal tiene un ciclo abierto en estado vacía. Al cambiar de tipo, el ciclo se cerrará.',
    }
  }
  return null
}

export function DrawerCambioTipoProductivo({
  animalId,
  tipoActualNombre,
  estadoReproductivo,
  tiposDisponibles,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [nuevoTipoId, setNuevoTipoId] = useState<string>('')
  // Confirmación explícita cuando el animal está cubierta: el ciclo se cerrará
  const [confirmadoCierre, setConfirmadoCierre] = useState(false)

  const tipoNuevoNombre   = tiposDisponibles.find(t => t.id === nuevoTipoId)?.nombre
  const mensaje           = getMensajeContextual(tipoNuevoNombre, tipoActualNombre, estadoReproductivo)
  const bloqueado         = mensaje?.tipo === 'bloqueo'

  const esSalidaDeReproductora = tipoActualNombre === 'Reproductora' && tipoNuevoNombre !== 'Reproductora'
  const requiereConfirmacion   = esSalidaDeReproductora && estadoReproductivo === 'cubierta'

  function handleClose() {
    setNuevoTipoId('')
    setConfirmadoCierre(false)
    onOpenChange(false)
  }

  function handleConfirmar() {
    if (!nuevoTipoId) return
    startTransition(async () => {
      const result = await submitCambiarTipoProductivo(animalId, nuevoTipoId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Tipo productivo cambiado a ${tipoNuevoNombre ?? ''}`)
        setNuevoTipoId('')
        setConfirmadoCierre(false)
        onOpenChange(false)
        router.refresh()
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Cambiar tipo productivo</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-5 pt-6 pb-4">
          {/* Tipo actual: siempre visible, solo informativo */}
          <div className="flex items-center justify-between py-2.5 border-b border-divider">
            <span className="text-sm text-ink-muted">Tipo actual</span>
            <span className="text-sm font-medium text-ink">
              {tipoActualNombre ?? '—'}
            </span>
          </div>

          {bloqueado ? (
            // Gestante: solo mensaje de bloqueo, sin formulario
            <p className="text-sm text-alert bg-alert-soft rounded-md px-3 py-2.5">
              {mensaje!.texto}
            </p>
          ) : (
            <>
              {/* Selector del nuevo tipo */}
              <Field>
                <FieldLabel>Nuevo tipo productivo</FieldLabel>
                <Select value={nuevoTipoId} onValueChange={(v) => setNuevoTipoId(v ?? '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {nuevoTipoId
                        ? (tiposDisponibles.find(t => t.id === nuevoTipoId)?.nombre ?? '—')
                        : <span className="text-muted-foreground">Selecciona un tipo…</span>
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {tiposDisponibles.map(tipo => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {/* Aviso contextual: vacía o cubierta */}
              {mensaje && (
                <p className="text-sm text-warning bg-warning-soft rounded-md px-3 py-2.5">
                  {mensaje.texto}
                </p>
              )}

              {/* Confirmación obligatoria cuando el animal está cubierta */}
              {requiereConfirmacion && (
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-divider"
                    style={{ accentColor: 'var(--color-world)' }}
                    checked={confirmadoCierre}
                    onChange={e => setConfirmadoCierre(e.target.checked)}
                  />
                  <span className="text-sm text-ink-muted leading-snug">
                    Entiendo que la cubrición registrada quedará sin desenlace y el ciclo se cerrará
                  </span>
                </label>
              )}
            </>
          )}
        </div>

        <SheetFooter className="pt-6">
          {bloqueado ? (
            <Button variant="outline" onClick={handleClose}>
              Cerrar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={pending}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmar}
                disabled={!nuevoTipoId || pending || (requiereConfirmacion && !confirmadoCierre)}
              >
                {pending ? 'Guardando…' : 'Confirmar cambio'}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
