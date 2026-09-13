'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Link from 'next/link'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

import type { InstalacionListItem } from '@/modules/ganadero/instalaciones/domain/types'

// Coordenadas base de la explotación (fallback cuando no hay coords de instalación)
const BASE_CENTER: [number, number] = [40.91874, -6.198609]
const DEFAULT_ZOOM = 17

// SVG pins personalizados — evita el problema de rutas de iconos de Leaflet en webpack
function makeSvgIcon(fill: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z"
        fill="${fill}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="4.5" fill="white" opacity="0.85"/>
    </svg>`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -40],
  })
}

// Iconos por estado — creados una sola vez al cargar el módulo (solo cliente)
const ICON_ANIMALES = makeSvgIcon('#166534') // verde mundo — admite animales
const ICON_STOCK    = makeSvgIcon('#3b82f6') // azul — solo stock
const ICON_INACTIVO = makeSvgIcon('#9CA3AF') // gris — inactiva

function getIcon(inst: InstalacionListItem): L.DivIcon {
  if (!inst.activo) return ICON_INACTIVO
  if (inst.admite_animales) return ICON_ANIMALES
  return ICON_STOCK
}

const TIPO_LABELS: Record<string, string> = {
  corral: 'Corral', nave: 'Nave', prado: 'Prado',
  cercado: 'Cercado', almacen: 'Almacén', otro: 'Otro',
}

interface Props {
  instalaciones: InstalacionListItem[]
  centroInicial?: [number, number]
  zoomInicial?: number
}

export default function MapaInstalaciones({ instalaciones, centroInicial, zoomInicial }: Props) {
  const conCoordenadas = instalaciones.filter(i => i.coordenadas !== null)

  return (
    <MapContainer
      center={centroInicial ?? BASE_CENTER}
      zoom={zoomInicial ?? DEFAULT_ZOOM}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      {/* PNOA — ortofotografía aérea oficial del IGN España, sin API key */}
      <TileLayer
        url="https://www.ign.es/wmts/pnoa-ma?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OI.OrthoimageCoverage&STYLE=default&TILEMATRIXSET=GoogleMapsCompatible&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg"
        attribution='&copy; <a href="https://www.ign.es">IGN España</a> · PNOA'
        maxZoom={20}
      />

      {conCoordenadas.map(inst => (
        <Marker
          key={inst.id}
          position={[inst.coordenadas!.lat, inst.coordenadas!.lng]}
          icon={getIcon(inst)}
        >
          <Popup>
            <div style={{ minWidth: 160, fontFamily: 'inherit' }}>
              <Link
                href={`/instalaciones/${inst.id}`}
                style={{ fontWeight: 700, color: '#166534', textDecoration: 'none', fontSize: 14 }}
              >
                {inst.nombre}
              </Link>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                {TIPO_LABELS[inst.tipo] ?? inst.tipo}
                {!inst.activo && (
                  <span style={{ marginLeft: 6, color: '#9CA3AF' }}>· Inactiva</span>
                )}
              </div>
              {inst.admite_animales && inst.num_animales > 0 && (
                <div style={{ fontSize: 12, marginTop: 4, color: '#374151' }}>
                  <strong>{inst.num_animales}</strong>{' '}
                  {inst.num_animales === 1 ? 'animal' : 'animales'}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
