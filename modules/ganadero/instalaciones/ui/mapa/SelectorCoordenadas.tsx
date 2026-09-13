'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'

const BASE: [number, number] = [40.91874, -6.198609]

const ICONO = L.divIcon({
  className: '',
  html: `<svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z"
      fill="#166534" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="4.5" fill="white" opacity="0.85"/>
  </svg>`,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
})

// Captura clicks en el mapa y permite arrastrar el marcador
function MarkerInteractivo({
  position,
  onMove,
}: {
  position: [number, number] | null
  onMove: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng)
    },
  })

  if (!position) return null

  return (
    <Marker
      position={position}
      draggable
      icon={ICONO}
      eventHandlers={{
        dragend(e) {
          const { lat, lng } = e.target.getLatLng()
          onMove(lat, lng)
        },
      }}
    />
  )
}

interface Props {
  // Posición inicial — solo se usa en el montaje, no reactivo
  lat?: number
  lng?: number
  onChange: (lat: number, lng: number) => void
}

export default function SelectorCoordenadas({ lat, lng, onChange }: Props) {
  const initialPos: [number, number] | null =
    lat != null && lng != null ? [lat, lng] : null

  const [position, setPosition] = useState<[number, number] | null>(initialPos)

  function handleMove(newLat: number, newLng: number) {
    const pos: [number, number] = [newLat, newLng]
    setPosition(pos)
    onChange(newLat, newLng)
  }

  return (
    <MapContainer
      center={position ?? BASE}
      zoom={position ? 18 : 17}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://www.ign.es/wmts/pnoa-ma?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OI.OrthoimageCoverage&STYLE=default&TILEMATRIXSET=GoogleMapsCompatible&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg"
        attribution='&copy; <a href="https://www.ign.es">IGN España</a> · PNOA'
        maxZoom={20}
      />
      <MarkerInteractivo position={position} onMove={handleMove} />
    </MapContainer>
  )
}
