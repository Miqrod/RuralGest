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
import { FormParto } from '@/modules/ganadero/reproductivo/ui/FormParto'
import { FormDestete } from '@/modules/ganadero/reproductivo/ui/FormDestete'
import { FormAborto } from '@/modules/ganadero/reproductivo/ui/FormAborto'
import type { EstadoVital, EstadoReproductivo } from '@/modules/ganadero/shared/domain/types'
import { getAvailableActions } from '@/modules/ganadero/animales/domain/availableActions'
import type { MachoOption } from '@/modules/ganadero/animales/application/queries/getMachosDisponibles'
import type { CriaParaDesteteItem } from '@/modules/ganadero/reproductivo/application/queries/getCriasParaDestete'

type AccionActiva = 'salida' | 'cubricion' | 'confirmacion' | 'parto' | 'destete' | 'aborto' | null

function buildPartoToastMessage(vivos: number, muertos: number): string {
  const a = (n: number, singular: string, plural: string) =>
    n === 1 ? `1 ${singular}` : `${n} ${plural}`

  if (muertos === 0) {
    return vivos === 1 ? 'Se ha creado 1 animal' : `Se han creado ${vivos} animales`
  }
  if (vivos === 0) {
    return `Se ${muertos === 1 ? 'ha' : 'han'} creado ${a(muertos, 'animal muerto', 'animales muertos')}`
  }
  return `Se han creado ${a(vivos, 'animal vivo', 'animales vivos')} y ${a(muertos, 'animal muerto', 'animales muertos')}`
}

interface Props {
  animalId:            string
  crotal?:             string | null
  nombre?:             string | null
  estadoVital:         EstadoVital
  esReproductora:      boolean
  estadoReproductivo:  EstadoReproductivo | null
  tieneCicloAbierto:   boolean
  machos:              MachoOption[]
  criasElegibles:      CriaParaDesteteItem[]
}

export function SeccionAcciones({ animalId, crotal, nombre, estadoVital, esReproductora, estadoReproductivo, tieneCicloAbierto, machos, criasElegibles }: Props) {
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

  function handlePartoClick() {
    setAccionActiva(accionActiva !== 'parto' ? 'parto' : null)
  }

  function handleDesteteClick() {
    setAccionActiva(accionActiva !== 'destete' ? 'destete' : null)
  }

  function handleAbortoClick() {
    setAccionActiva(accionActiva !== 'aborto' ? 'aborto' : null)
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

  function handlePartoSuccess(vivos: number, muertos: number) {
    setAccionActiva(null)
    setPanelOpen(false)
    toast.success('Parto registrado correctamente', {
      description: buildPartoToastMessage(vivos, muertos),
    })
    router.refresh()
  }

  function handleDesteteSuccess(count: number, cicloCerrado: boolean) {
    setAccionActiva(null)
    setPanelOpen(false)
    toast.success('Destete registrado correctamente', {
      description: cicloCerrado ? 'Todas las crías destetadas. Ciclo completado.' : undefined,
    })
    router.refresh()
  }

  function handleAbortoSuccess() {
    setAccionActiva(null)
    setPanelOpen(false)
    toast.success('Aborto registrado correctamente')
    router.refresh()
  }

  if (estadoVital !== 'vivo') return null

  const acciones = getAvailableActions({
    estadoVital,
    estadoReproductivo,
    tieneCicloAbierto,
    esReproductora,
    tieneCriasElegibles: criasElegibles.length > 0,
  })

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
                {acciones.has('cubricion') && (
                  <Button
                    type="button"
                    variant={accionActiva === 'cubricion' ? 'outline' : 'default'}
                    className="h-auto py-2 px-5"
                    onClick={handleCubricionClick}
                  >
                    {estadoReproductivo === 'cubierta' ? 'Registrar nueva cubrición' : 'Registrar cubrición'}
                  </Button>
                )}
                {acciones.has('confirmacion') && (
                  <Button
                    type="button"
                    variant={accionActiva === 'confirmacion' ? 'outline' : 'default'}
                    className="h-auto py-2 px-5"
                    onClick={handleConfirmacionClick}
                  >
                    Confirmar gestación
                  </Button>
                )}
                {acciones.has('parto') && (
                  <Button
                    type="button"
                    variant={accionActiva === 'parto' ? 'outline' : 'default'}
                    className="h-auto py-2 px-5"
                    onClick={handlePartoClick}
                  >
                    Registrar parto
                  </Button>
                )}
                {acciones.has('destete') && (
                  <Button
                    type="button"
                    variant={accionActiva === 'destete' ? 'outline' : 'default'}
                    className="h-auto py-2 px-5"
                    onClick={handleDesteteClick}
                  >
                    Registrar destete
                  </Button>
                )}
                {acciones.has('aborto') && (
                  <Button
                    type="button"
                    variant={accionActiva === 'aborto' ? 'outline' : 'default'}
                    className="h-auto py-2 px-5"
                    onClick={handleAbortoClick}
                  >
                    Registrar aborto
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
                        <div className="rounded-md border border-warning bg-warning-soft px-4 py-3 text-sm text-warning space-y-1">
                          <p className="font-medium">Este animal ya tiene una cubrición registrada.</p>
                          <p>Continúa únicamente si realmente se ha producido una nueva cubrición.</p>
                          <p>El sistema conservará el historial y utilizará la cubrición más reciente para continuar el seguimiento de la gestación. Se recalculará la fecha prevista de parto.</p>
                        </div>
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
                        estadoReproductivo={estadoReproductivo!}
                        machos={machos}
                        onSuccess={handleConfirmacionSuccess}
                        onCancel={() => setAccionActiva(null)}
                      />
                    </div>
                  </motion.div>
                )}

                {accionActiva === 'parto' && (
                  <motion.div
                    key="form-parto"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="bg-canvas rounded-lg border border-divider p-5 mt-1">
                      <FormParto
                        animalId={animalId}
                        crotal={crotal}
                        nombre={nombre}
                        onSuccess={handlePartoSuccess}
                        onCancel={() => setAccionActiva(null)}
                      />
                    </div>
                  </motion.div>
                )}

                {accionActiva === 'destete' && (
                  <motion.div
                    key="form-destete"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="bg-canvas rounded-lg border border-divider p-5 mt-1">
                      <FormDestete
                        madreId={animalId}
                        madreNombre={nombre}
                        madreCrotal={crotal}
                        criasElegibles={criasElegibles}
                        onSuccess={handleDesteteSuccess}
                        onCancel={() => setAccionActiva(null)}
                      />
                    </div>
                  </motion.div>
                )}

                {accionActiva === 'aborto' && (
                  <motion.div
                    key="form-aborto"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="bg-canvas rounded-lg border border-divider p-5 mt-1">
                      <FormAborto
                        animalId={animalId}
                        crotal={crotal}
                        nombre={nombre}
                        onSuccess={handleAbortoSuccess}
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
