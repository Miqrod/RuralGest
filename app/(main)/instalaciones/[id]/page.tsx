import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin, Package, Users, CheckCircle2, XCircle,
} from 'lucide-react'
import { MapaInstalacionesClient } from '@/modules/ganadero/instalaciones/ui/mapa/MapaInstalacionesClient'
import { PageContainer } from '@/components/layout/PageContainer'
import { getDetalleInstalacion } from '@/modules/ganadero/instalaciones/application/queries/getDetalleInstalacion'
import { getAnimalesEnInstalacion } from '@/modules/ganadero/instalaciones/application/queries/getAnimalesEnInstalacion'
import { listarDestinosReubicacion } from '@/modules/ganadero/instalaciones/application/queries/listarDestinosReubicacion'
import { cn } from '@/lib/utils'
import { SeccionAnimales } from './SeccionAnimales'
import type { TipoInstalacion } from '@/modules/ganadero/shared/domain/types'

interface Props {
  params: Promise<{ id: string }>
}

const TIPO_LABELS: Record<TipoInstalacion, string> = {
  corral:  'Corral',
  nave:    'Nave',
  prado:   'Prado',
  cercado: 'Cercado',
  almacen: 'Almacén',
  otro:    'Otro',
}

// Pill reutilizable: misma estética que los pills de AnimalHeader
const pill = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-surface-alt text-ink-muted'

export default async function InstalacionDetallePage({ params }: Props) {
  const { id } = await params
  const [instalacion, animales, destinos] = await Promise.all([
    getDetalleInstalacion(id),
    getAnimalesEnInstalacion(id),
    listarDestinosReubicacion(),
  ])

  if (!instalacion) notFound()

  return (
    <PageContainer>

      {/* Título de página + link volver — misma jerarquía que ficha animal */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-world">Instalaciones</h1>
          <p className="text-sm text-ink-muted mt-1">Detalles de la instalación</p>
        </div>
        <Link
          href="/instalaciones"
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors"
        >
          ← Volver a instalaciones
        </Link>
      </div>

      <div className="flex flex-col gap-4">

        {/* Cabecera de instalación — misma estética que AnimalHeader */}
        <div
          className="rounded-lg border border-world shadow-sm p-5"
          style={{ backgroundColor: 'var(--world-accent-soft)' }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h2 className="text-2xl font-bold text-world">{instalacion.nombre}</h2>

            {/* Badge Activa / Inactiva */}
            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
              instalacion.activo
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-alert-soft text-alert',
            )}>
              {instalacion.activo
                ? <CheckCircle2 className="h-3.5 w-3.5" />
                : <XCircle className="h-3.5 w-3.5" />
              }
              {instalacion.activo ? 'Activa' : 'Inactiva'}
            </span>
          </div>

          {/* Pills: tipo, usos, coordenadas */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={pill}>{TIPO_LABELS[instalacion.tipo]}</span>

            {instalacion.admite_animales && (
              <span className={pill}>
                <Users className="h-3 w-3" />
                Animales
              </span>
            )}
            {instalacion.admite_stock && (
              <span className={pill}>
                <Package className="h-3 w-3" />
                Stock
              </span>
            )}
            {instalacion.coordenadas && (
              <span className={cn(pill, 'font-mono')}>
                <MapPin className="h-3 w-3" />
                {instalacion.coordenadas.lat.toFixed(6)}, {instalacion.coordenadas.lng.toFixed(6)}
              </span>
            )}
          </div>

          {/* Observaciones: solo si existen */}
          {instalacion.observaciones && (
            <p className="text-sm text-ink-muted mt-3 pt-3 border-t border-world/20">
              {instalacion.observaciones}
            </p>
          )}
        </div>

        {/* ── Mapa centrado en esta instalación ────────────────────────────── */}
        {instalacion.coordenadas && (
          <div className="h-64 rounded-lg overflow-hidden border border-divider shadow-sm">
            <MapaInstalacionesClient
              instalaciones={[instalacion]}
              centroInicial={[instalacion.coordenadas.lat, instalacion.coordenadas.lng]}
              zoomInicial={18}
            />
          </div>
        )}

        {/* ── Sección animales ─────────────────────────────────────────────── */}
        {instalacion.admite_animales && (
          <SeccionAnimales
            instalacion={instalacion}
            animales={animales}
            destinos={destinos}
          />
        )}

        {/* ── Sección stock ────────────────────────────────────────────────── */}
        {instalacion.admite_stock && (
          <section className="rounded-lg border border-divider bg-canvas shadow-sm overflow-hidden">
            {/* Cabecera de sección */}
            <div className="px-5 py-4 border-b border-divider/50 bg-surface-alt">
              <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wide">
                Stock almacenado
              </h3>
            </div>
            <div className="flex h-40 flex-col items-center justify-center gap-2">
              <Package className="h-7 w-7 text-ink-muted/30" />
              <p className="text-sm font-medium text-ink-muted">Gestión de stock</p>
              <p className="text-xs text-ink-muted/60">Disponible próximamente.</p>
            </div>
          </section>
        )}

      </div>
    </PageContainer>
  )
}
