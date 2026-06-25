'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

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
  const [panelOpen,      setPanelOpen]      = useState(false)
  const [accionActiva,   setAccionActiva]   = useState<AccionActiva>(null)
  const [headerHovered,  setHeaderHovered]  = useState(false)
  // Mantenemos el formulario montado tras la primera apertura para que la
  // animación de cierre funcione (el grid colapsa suavemente, no desmonta).
  const [formMounted,    setFormMounted]    = useState(false)

  function togglePanel() {
    const closing = panelOpen
    setPanelOpen(!panelOpen)
    // Al cerrar el panel también cerramos el formulario si estaba abierto
    if (closing) setAccionActiva(null)
  }

  function handleSalidaClick() {
    if (accionActiva !== 'salida') {
      setFormMounted(true)
      setAccionActiva('salida')
    } else {
      setAccionActiva(null)
    }
  }

  function handleSuccess() {
    setAccionActiva(null)
    setPanelOpen(false)
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
        <ChevronDown
          className={cn(
            'size-4 text-ink-muted transition-transform duration-300',
            panelOpen && 'rotate-180',
          )}
        />
      </button>

      {/* ── Contenido del panel: animación de máscara por altura ──────────── */}
      <div
        className={cn(
          cn('grid transition-[grid-template-rows,background-color] duration-300 ease-in-out', headerHovered ? 'bg-[#E5E7EB] dark:bg-[#28211e]' : 'bg-surface-alt'),
          panelOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden min-h-0">
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

            {/* ── Formulario inline: animación de máscara por altura ──────── */}
            {formMounted && (
              <div
                className={cn(
                  'grid transition-[grid-template-rows] duration-300 ease-in-out',
                  accionActiva === 'salida' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
              >
                <div className="overflow-hidden min-h-0">
                  <div className="bg-canvas rounded-lg border border-divider p-5 mt-1">
                    <FormSalidaAnimal
                      animalId={animalId}
                      crotal={crotal}
                      onSuccess={handleSuccess}
                      onCancel={() => setAccionActiva(null)}
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

    </div>
  )
}
