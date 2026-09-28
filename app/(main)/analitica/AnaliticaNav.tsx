'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/analitica/reproduccion', label: 'Reproducción' },
]

// Sub-navegación horizontal del módulo Analítica.
// Tabs alineados al borde inferior del contenedor — el borde del nav coincide con el de cada tab activo.
export function AnaliticaNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-0 border-b border-divider">
      {TABS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
            pathname.startsWith(href)
              ? 'border-world text-world'
              : 'border-transparent text-ink-muted hover:text-ink hover:border-divider',
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
