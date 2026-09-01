import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  children: ReactNode
  className?: string
  // Slot opcional para un botón/acción junto al título (ej. lápiz de edición)
  action?: ReactNode
}

export function FichaSection({ title, children, className, action }: Props) {
  return (
    <section className={cn('rounded-lg border border-divider bg-canvas shadow-sm p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wide">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}
