'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { formatFechaLarga } from '@/lib/format'
import { submitMachorraAnimales } from '@/app/(main)/home/actions'
import { EstadoReproductivoBadge } from '@/modules/ganadero/animales/ui/ficha/EstadosBadges'
import type { AnimalEnRevisionReproductiva } from '../../application/queries/getRevisionReproductiva'

interface Props {
  animales:   AnimalEnRevisionReproductiva[]
  umbralDias: number
}

export function WidgetRevisionReproductiva({ animales, umbralDias }: Props) {
  const router = useRouter()
  const [open, setOpen]           = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()

  const total = animales.length

  function handleOpenChange(v: boolean) {
    setOpen(v)
    // Limpiar selección al cerrar
    if (!v) setSelected(new Set())
  }

  function toggleAnimal(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === animales.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(animales.map((a) => a.id)))
    }
  }

  function handleSubmit() {
    const ids = Array.from(selected)
    startTransition(async () => {
      const result = await submitMachorraAnimales(ids)
      if (result?.error) {
        toast.error(result.error)
      } else {
        const n = ids.length
        toast.success(`${n} ${n === 1 ? 'animal marcado' : 'animales marcados'} como ${n === 1 ? 'machorra' : 'machorras'}`)
        setConfirmOpen(false)
        handleOpenChange(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      {/* ── Tarjeta del widget ─────────────────────────────────────────────── */}
      <div className="@container bg-world-gradient rounded-2xl p-6 text-white shadow-md relative overflow-hidden h-full flex flex-col">

        <h3 className="text-lg font-extrabold tracking-tight text-white/90 mb-4 relative z-10">
          Revisión reproductiva
        </h3>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 flex flex-col items-center gap-2 text-white border border-white/10 flex-1 relative z-10">
          <span className="text-[11px] font-black tracking-widest text-white/70 uppercase">
            Vacuno
          </span>
          <span className="text-5xl font-black tabular-nums tracking-tighter leading-none">
            {total}
          </span>
          <span className="text-xs text-white/70">
            {total === 1 ? 'animal en revisión' : 'animales en revisión'}
          </span>
          <Button
            onClick={() => setOpen(true)}
            disabled={total === 0}
            className="mt-1 bg-white text-world hover:bg-white/90 shadow h-auto py-2 px-6 disabled:opacity-40"
          >
            Revisar
          </Button>
        </div>

        {/* Decoración de fondo */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── Drawer ────────────────────────────────────────────────────────── */}
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="flex flex-col sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Revisión reproductiva (vacuno)</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

            {/* Descripción contextual */}
            <p className="text-sm text-ink-muted leading-relaxed">
              Los siguientes animales llevan más de{' '}
              <strong className="text-ink">{umbralDias} días</strong>{' '}
              sin haber quedado gestantes. Son susceptibles de presentar problemas
              reproductivos. Considera registrarlos como machorras para reflejar
              esta situación en el historial reproductivo.
            </p>

            {/* Tabla de animales con borde redondeado */}
            <div className="rounded-lg border border-divider shadow-sm overflow-hidden">
              {/* Cabecera — "Seleccionar todos" integrado como header de tabla */}
              <div className="bg-surface-alt border-b border-divider px-4 py-3 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={animales.length > 0 && selected.size === animales.length}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-divider accent-world shrink-0"
                />
                <label
                  htmlFor="select-all"
                  className="text-[11px] font-bold text-ink-muted uppercase tracking-wider cursor-pointer select-none"
                >
                  Animal
                </label>
                <span className="ml-auto text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                  Días en ciclo
                </span>
              </div>

              {/* Filas */}
              <div className="divide-y divide-divider/40">
                {animales.map((animal) => (
                  <label
                    key={animal.id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-alt/60 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(animal.id)}
                      onChange={() => toggleAnimal(animal.id)}
                      className="h-4 w-4 rounded border-divider accent-world shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                      <p className="truncate text-sm text-ink">
                        <span className="font-medium">
                          {animal.crotal ?? <span className="italic text-ink-muted">Sin crotal</span>}
                        </span>
                        {animal.nombre && (
                          <span className="text-ink-muted"> · {animal.nombre}</span>
                        )}
                      </p>
                      <EstadoReproductivoBadge estado={animal.estado_reproductivo} className="shrink-0" />
                    </div>
                    <span className="text-sm tabular-nums text-ink-muted shrink-0">
                      {animal.dias_en_ciclo}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer con acción */}
          <div className="border-t border-divider px-5 py-4 flex items-center justify-between gap-4 shrink-0">
            <span className="text-sm text-ink-muted">
              {selected.size === 0
                ? 'Ningún animal seleccionado'
                : `${selected.size} ${selected.size === 1 ? 'animal seleccionado' : 'animales seleccionados'}`}
            </span>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={selected.size === 0 || pending}
            >
              {`Marcar como machorra${selected.size > 1 ? 's' : ''}`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal de confirmación — mismo patrón que ConfirmMachorraModal, adaptado a operación múltiple */}
      <Dialog open={confirmOpen} onOpenChange={(v) => { if (!pending) setConfirmOpen(v) }}>
        <DialogContent showCloseButton={false} className="ring-warning/40">
          <DialogHeader>
            <DialogTitle>
              {selected.size === 1 ? '¿Marcar como machorra?' : `¿Marcar ${selected.size} animales como machorras?`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm text-ink">
            <p>Se registrará que estas oportunidades reproductivas no han dado resultado:</p>
            <ul className="space-y-1 text-ink-muted pl-1">
              {Array.from(selected).map((id) => {
                const a = animales.find((x) => x.id === id)
                if (!a) return null
                const label = a.nombre && a.crotal
                  ? `${a.nombre} (${a.crotal})`
                  : a.nombre ?? a.crotal ?? id
                return <li key={id} className="text-ink font-medium">{label}</li>
              })}
              <li className="mt-1">Fecha: <span className="text-ink">{formatFechaLarga(new Date())}</span></li>
            </ul>
            <p className="text-ink-muted text-xs pt-1">
              Cada ciclo reproductivo activo se cerrará. Las hembras quedarán de nuevo en estado{' '}
              <span className="font-medium">Vacía</span> y podrán comenzar una nueva oportunidad reproductiva.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={pending}
            >
              {pending ? 'Procesando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
