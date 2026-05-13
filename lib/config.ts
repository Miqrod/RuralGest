import type { LucideIcon } from 'lucide-react'
import { Sprout } from 'lucide-react'

export interface SiteConfig {
  name: string
  logoUrl?: string     // imagen subida por el usuario desde configuración
  logoFallback: LucideIcon  // placeholder si logoUrl no está definido
}

export const siteConfig: SiteConfig = {
  name: 'Hermanos Rodríguez',
  logoFallback: Sprout,
}
