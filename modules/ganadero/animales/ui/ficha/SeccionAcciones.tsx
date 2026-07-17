'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FormSalidaAnimal } from '../salida/FormSalidaAnimal'
import { FormCubricion } from '@/modules/ganadero/reproductivo/ui/FormCubricion'
import { FormConfirmacionGestacion } from '@/modules/ganadero/reproductivo/ui/FormConfirmacionGestacion'
import type { EstadoVital, EstadoReproductivo } from '@/modules/ganadero/shared/domain/types'
import type { MachoOption } from '@/modules/ganadero/animales/application/queries/getMachosDisponibles'

type AccionActiva = 'salida' | 'cubricion' | 'confirmacion' | null

interface Props {
  animalId:            string
  crotal?:             string | null
  estadoVital:         EstadoVital
  esReproductora:      boolean
  estadoReproductivo:  EstadoReproductivo | null
  machos:              MachoOption[]
}

export function SeccionAcciones({ animalId, crotal, estadoVital, esReproductora, estadoReproductivo, machos }: Props) {
  const router = useRouter()
  const [panelOpen,     setPanelOpen]     = useState(false)
  const [accionActiva,  setAccionActiva]  = useState<AccionActiva>(null)
  const [headerHovered, setHeaderHovered] = useState(false)

  function togglePanel() {
    const closing = panelOpen
    setPanelOpen(!panelOpen)
    if (closing) setAccionActiva(null)
  }

  function handleSalidaClick() {
    setAccionActiva(accionActiva !== 'salida' ? 'salida' : null)
  }

  function handleCubricionClick() {
    setAccionActiva(accionActiva !== 'cubricion' ? 'cubricion' : null)
  }

  function handleConfirmacionClick() {
    setAccionActiva(accionActiva !== 'confirmacion' ? 'confirmacion' : null)
  }

  function handleSalidaSuccess() {
    setAccionActiva(null)
    setPanelOpen(false)
    toast.success('Salida registrada correctamente')
    router.refresh()
  }

  function handleCubricionSuccess() {
    setAccionActiva(null)
    setPanelOpen(false)
    toast.success('Cubrición registrada correctamente')
    router.refresh()
  }

  function handleConfirmacionSuccess() {
    setAccionActiva(null)
    setPanelOpen(false)
    toast.success('Gestación confirmada correctamente')
    router.refresh()
  }

  if (estadoVital !== 'vivo') return null

  return (
    <div className="rounded-lg border border-divider shadow-sm overflow-hidden">

      {/* ── Cabecera: ÚNICO trigger del panel ─────────────────────────────── */}
      <button
        type="button"
        onClick={togglePanel}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        className={cn(
          'w-full flex items-center justify-between px-5 py-4 transition-colors cursor-pointer',
          headerHovered ? 'bg-[#E5E7EB] dark:bg-[#28211e]' : 'bg-surface-alt',
        )}
      >
        <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wide">
          Acciones
        </h2>
        <motion.div
          animate={{ rotate: panelOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <ChevronDown className="size-4 text-ink-muted" />
        </motion.div>
      </button>

      {/* ── Contenido del panel ────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {panelOpen && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            className={headerHovered ? 'bg-[#E5E7EB] dark:bg-[#28211e]' : 'bg-surface-alt'}
          >
            <div className="px-5 pt-1 pb-5 space-y-3">

              {/* Botones de acción */}
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant={accionActiva === 'salida' ? 'outline' : 'default'}
                  className="h-auto py-2 px-5"
                  onClick={handleSalidaClick}
                >
                  Registrar salida
                </Button>
                {esReproductora && (estadoReproductivo === 'vacia' || estadoReproductivo === 'cubierta') && (
                  <Button
                    type="button"
                    variant={accionActiva === 'cubricion' ? 'outline' : 'default'}
                    className="h-auto py-2 px-5"
                    onClick={handleCubricionClick}
                  >
                    {estadoReproductivo === 'cubierta' ? 'Registrar nueva cubrición' : 'Registrar cubrición'}
                  </Button>
                )}
                {esReproductora && estadoReproductivo === 'cubierta' && (
                  <Button
                    type="button"
                    variant={accionActiva === 'confirmacion' ? 'outline' : 'default'}
                    className="h-auto py-2 px-5"
                    onClick={handleConfirmacionClick}
                  >
                    Confirmar gestación
                  </Button>
                )}
              </div>

              {/* ── Formulario inline ──────────────────────────────────────── */}
              <AnimatePresence initial={false}>
                {accionActiva === 'salida' && (
                  <motion.div
                    key="form-salida"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="bg-canvas rounded-lg border border-divider p-5 mt-1">
                      <FormSalidaAnimal
                        animalId={animalId}
                        crotal={crotal}
                        onSuccess={handleSalidaSuccess}
                        onCancel={() => setAccionActiva(null)}
                      />
                    </div>
                  </motion.div>
                )}

                {accionActiva === 'cubricion' && (
                  <motion.div
                    key="form-cubricion"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="bg-canvas rounded-lg border border-divider p-5 mt-1 space-y-4">
                      {estadoReproductivo === 'cubierta' && (
                        <p className="text-sm text-warning bg-warning-soft rounded-md px-3 py-2">
                          Este animal ya tiene una cubrición en curso. Registrar una nueva cubrición añadirá el evento al mismo ciclo y recalculará la fecha prevista de parto desde la nueva fecha de cubrición.
                        </p>
                      )}
                      <FormCubricion
                        animalId={animalId}
                        crotal={crotal}
                        machos={machos}
                        onSuccess={handleCubricionSuccess}
                        onCancel={() => setAccionActiva(null)}
                      />
                    </div>
                  </motion.div>
                )}

                {accionActiva === 'confirmacion' && (
                  <motion.div
                    key="form-confirmacion"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="bg-canvas rounded-lg border border-divider p-5 mt-1">
                      <FormConfirmacionGestacion
                        animalId={animalId}
                        crotal={crotal}
                        onSuccess={handleConfirmacionSuccess}
                        onCancel={() => setAccionActiva(null)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
