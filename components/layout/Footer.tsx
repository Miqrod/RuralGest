'use client'

import { useSidebar } from '@/providers/SidebarProvider'
import { cn } from '@/lib/utils'

export function Footer() {
  const { collapsed } = useSidebar()

  return (
    <footer
      className={cn(
        'fixed bottom-0 h-10 z-40 flex items-center justify-between px-6',
        'left-0 w-full',
        collapsed
          ? 'md:left-16 md:w-[calc(100%-4rem)]'
          : 'md:left-64 md:w-[calc(100%-16rem)]',
        'bg-surface-alt/80 backdrop-blur-md border-t border-divider/60',
        'shadow-[0_4px_24px_0_rgba(0,0,0,0.10)]',
        'transition-[left,width] duration-300 ease-in-out',
      )}
    >
      <span className="text-xs text-ink-muted">
        © {new Date().getFullYear()} Hermanos Rodríguez. Todos los derechos reservados.
      </span>

      {/* Placeholder para enlaces futuros */}
      <nav className="flex items-center gap-4">
        {/* <Link href="/privacidad" className="text-xs text-ink-muted hover:text-ink transition-colors">Privacidad</Link> */}
      </nav>
    </footer>
  )
}
