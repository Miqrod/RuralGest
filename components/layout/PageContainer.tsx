import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  className?: string
}

/** Contenedor estándar: fluido hasta --max-w-content (1280px), luego centrado. */
export function PageContainer({ children, className }: Props) {
  return (
    <div className={cn('w-full max-w-content mx-auto px-6 py-7', className)}>
      {children}
    </div>
  )
}

/** Contenedor ancho: ocupa siempre todo el ancho disponible (analíticas, calendario...). */
export function PageContainerWide({ children, className }: Props) {
  return (
    <div className={cn('w-full px-6 py-8', className)}>
      {children}
    </div>
  )
}
