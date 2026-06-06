import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  children: ReactNode
  className?: string
}

export function FichaSection({ title, children, className }: Props) {
  return (
    <section className={cn('rounded-lg border border-divider bg-white shadow-sm p-5', className)}>
      <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-4">
        {title}
      </h2>
      {children}
    </section>
  )
}
