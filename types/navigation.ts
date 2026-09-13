import type { LucideIcon } from 'lucide-react'

export type WorldId = 'default' | 'vacuno' | 'porcino' | 'financiero' | 'configuracion'

export interface NavItem {
  href?: string        // undefined en ítems padre que solo despliegan submenú
  label: string
  icon: LucideIcon
  world: WorldId
  hidden?: boolean
  children?: NavItem[]
  // Muestra un título de sección encima de este ítem dentro de un acordeón
  sectionLabel?: string
  // Override del cálculo de active state. Si se omite, usa pathname.startsWith(href).
  // Útil cuando un ítem comparte prefijo con un hermano (ej. /instalaciones vs /instalaciones/reubicaciones).
  isActive?: (pathname: string) => boolean
}

export interface WorldConfig {
  id: WorldId
  color: string // hex — debe coincidir con --color-world en globals.css
}
