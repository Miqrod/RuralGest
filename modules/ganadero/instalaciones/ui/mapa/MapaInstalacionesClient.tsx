'use client'

import dynamic from 'next/dynamic'
import type { InstalacionListItem } from '@/modules/ganadero/instalaciones/domain/types'

// ssr: false solo puede usarse en Client Components
const MapaInstalaciones = dynamic(
  () => import('./MapaInstalaciones'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-stone-50 dark:bg-stone-900/30">
        <span className="text-sm text-ink-muted">Cargando mapa…</span>
      </div>
    ),
  }
)

interface Props {
  instalaciones: InstalacionListItem[]
  centroInicial?: [number, number]
  zoomInicial?: number
}

export function MapaInstalacionesClient(props: Props) {
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapaInstalaciones {...props} />
    </div>
  )
}
