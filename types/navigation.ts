import type { LucideIcon } from 'lucide-react'

export type WorldId = 'default' | 'vacuno' | 'porcino' | 'financiero'

export interface NavItem {
  href?: string        // undefined en ítems padre que solo despliegan submenú
  label: string
  icon: LucideIcon
  world: WorldId
  hidden?: boolean
  children?: NavItem[]
}

export interface WorldConfig {
  id: WorldId
  color: string // hex — debe coincidir con --color-world en globals.css
}
