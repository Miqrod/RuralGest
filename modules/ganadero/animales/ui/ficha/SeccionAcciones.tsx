'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FormSalidaAnimal } from '../salida/FormSalidaAnimal'
import type { EstadoVital } from '@/modules/ganadero/shared/domain/types'

type AccionActiva = 'salida' | null

interface Props {
  animalId:    string
  crotal?:     string | null
  estadoVital: EstadoVital
}

export function SeccionAcciones({ animalId, crotal, estadoVital }: Props) {
  const router = useRouter()
  const [panelOpen,    setPanelOpen]    = useState(false)
  const [accionActiva, setAccionActiva] = useState<AccionActiva>(null)
  const [headerHovered, setHeaderHovered] = useState(false)

  function togglePanel() {
    const closing = panelOpen
    setPanelOpen(!panelOpen)
    if (closing) setAccionActiva(null)
  }

  function handleSalidaClick() {
    setAccionActiva(accionActiva !== 'salida' ? 'salida' : null)
  }

  function handleSuccess() {
    setAccionActiva(null)
    setPanelOpen(false)
    toast.success('Salida registrada correctamente')
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
                {/* Futuros botones: Registrar parto, Registrar cubrición… */}
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
                        onSuccess={handleSuccess}
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
