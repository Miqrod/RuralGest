'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EstadoVitalBadge } from './EstadosBadges'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatFecha } from '@/lib/format'
import type { AnimalDetail } from '@/modules/ganadero/animales/application/queries/getAnimalDetail'
import type { HistorialUbicacionItem } from '@/modules/ganadero/instalaciones/domain/types'

const SEXO_LABEL: Record<string, string> = {
  macho:  'Macho',
  hembra: 'Hembra',
}

const pill = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-surface-alt text-ink-muted'

// Coletillas contextuales según §7 PRD014 — solo se muestran en cambios automáticos
const CONTEXTO_LABEL: Record<string, string> = {
  parto:  'parto',
  compra: 'compra',
  venta:  'venta',
  muerte: 'muerte',
}

// ── Drawer de historial de ubicaciones ───────────────────────────────────────

function HistorialUbicacionDrawer({
  open,
  onOpenChange,
  historial,
  loading,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  historial: HistorialUbicacionItem[] | null
  loading: boolean
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Historial de ubicación</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <p className="text-sm text-ink-muted text-center py-8">Cargando…</p>
          )}

          {!loading && historial !== null && historial.length === 0 && (
            <p className="text-sm text-ink-muted text-center py-8">
              Sin historial de ubicación registrado.
            </p>
          )}

          {!loading && historial !== null && historial.length > 0 && (
            <div className="rounded-lg border border-divider shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-alt">
                    <th className="text-left text-[11px] font-bold text-ink-muted uppercase tracking-wider px-4 py-3 border-b border-divider">
                      Origen
                    </th>
                    <th className="text-left text-[11px] font-bold text-ink-muted uppercase tracking-wider px-4 py-3 border-b border-divider">
                      Destino
                    </th>
                    <th className="text-right text-[11px] font-bold text-ink-muted uppercase tracking-wider px-4 py-3 border-b border-divider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider/40">
                  {historial.map((item) => (
                    <tr key={item.evento_id}>
                      <td className="px-4 py-2.5 align-top">
                        <span className={item.instalacion_origen_nombre ? 'text-ink' : 'italic text-ink-muted'}>
                          {item.instalacion_origen_nombre ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-top">
                        <span className={item.instalacion_destino_nombre ? 'text-ink' : 'italic text-ink-muted'}>
                          {item.instalacion_destino_nombre ?? 'Sin ubicación'}
                        </span>
                        {item.contexto && (
                          <span className="ml-1 text-xs text-ink-muted/60">
                            ({CONTEXTO_LABEL[item.contexto] ?? item.contexto})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-ink-muted align-top whitespace-nowrap">
                        {formatFecha(item.fecha)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── AnimalHeader ──────────────────────────────────────────────────────────────

interface Props {
  animal: AnimalDetail
  // Server action inyectada desde la página — fetch lazy del historial de ubicaciones.
  // Opcional: si no se proporciona, se muestra la ubicación pero sin botón de historial.
  fetchHistorial?: () => Promise<HistorialUbicacionItem[]>
}

export function AnimalHeader({ animal, fetchHistorial }: Props) {
  const identificador = animal.crotal ?? animal.num_hierro
  const subtitulo = animal.crotal && animal.num_hierro
    ? `Hierro: ${animal.num_hierro}`
    : null

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [historial, setHistorial] = useState<HistorialUbicacionItem[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleOpenHistorial() {
    if (!fetchHistorial) return
    setDrawerOpen(true)
    // Carga solo en la primera apertura; las siguientes reusan los datos en memoria
    if (historial === null) {
      setLoading(true)
      try {
        const data = await fetchHistorial()
        setHistorial(data)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <>
      <div
        className="rounded-lg border border-world shadow-sm p-5"
        style={{ backgroundColor: 'var(--world-accent-soft)' }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className={cn(
              'text-2xl font-bold',
              identificador ? 'text-world' : 'text-ink-muted italic'
            )}>
              {identificador ?? 'Sin crotal'}
            </h1>
            {animal.nombre && (
              <p className="text-base font-medium text-ink mt-0.5">{animal.nombre}</p>
            )}
            {subtitulo && (
              <p className="text-sm text-ink-muted mt-0.5">{subtitulo}</p>
            )}
          </div>

          {/* Badge de estado vital — zoom spring al cambiar tras registrar salida */}
          <AnimatePresence mode="wait">
            <motion.div
              key={animal.estado_vital}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              <EstadoVitalBadge
                estado={animal.estado_vital}
                className="text-sm px-3 py-1 mt-1"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pills: sexo, tipo productivo, raza */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className={pill}>
            {animal.sexo !== null ? (SEXO_LABEL[animal.sexo] ?? animal.sexo) : 'Sin determinar'}
          </span>
          {animal.tipo_productivo_nombre && (
            <span className={pill}>{animal.tipo_productivo_nombre}</span>
          )}
          {animal.raza_nombre && (
            <span className={pill}>{animal.raza_nombre}</span>
          )}
        </div>

        {/* Ubicación actual + acceso al historial */}
        <div className="flex items-center gap-1.5 mt-2.5">
          <MapPin className="h-3.5 w-3.5 text-ink-muted/50 shrink-0" />
          <span className="text-sm text-ink-muted">
            {animal.ubicacion_actual_nombre ?? <span className="italic">Sin ubicación</span>}
          </span>
          {fetchHistorial && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={handleOpenHistorial}
                      aria-label="Ver historial de ubicaciones"
                      className="ml-1 inline-flex cursor-pointer items-center justify-center rounded border border-world bg-world-soft p-0.5 text-world shadow-sm hover:bg-world/20 hover:text-world"
                    />
                  }
                >
                  <Plus className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  Ver historial de cambios de ubicación
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <HistorialUbicacionDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        historial={historial}
        loading={loading}
      />
    </>
  )
}
