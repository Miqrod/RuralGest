'use client'

import { Bell, CircleUser, Menu, Moon, Search, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { useSidebar } from '@/providers/SidebarProvider'
import { WeatherWidget } from './WeatherWidget'
import { cn } from '@/lib/utils'

// ── Theme toggle ─────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2 rounded-full text-ink-muted hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  )
}

// ── Notifications ─────────────────────────────────────────────────────────────

function NotificationsButton() {
  return (
    <button className="relative p-2 rounded-full text-ink-muted hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
      <Bell className="w-5 h-5" />
      {/* Badge — mostrar condicionalmente cuando haya notificaciones */}
      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-alert" />
    </button>
  )
}

// ── Header ───────────────────────────────────────────────────────────────────

export function Header() {
  const { collapsed, toggleMobile } = useSidebar()

  return (
    <header
      className={cn(
        'fixed top-0 h-16 z-40 flex items-center gap-4 px-6',
        'left-0 w-full',
        collapsed
          ? 'md:left-16 md:w-[calc(100%-4rem)]'
          : 'md:left-64 md:w-[calc(100%-16rem)]',
        'bg-canvas/80 backdrop-blur-md',
        'border-b border-divider/60',
        'shadow-[0_4px_24px_0_rgba(0,0,0,0.06)]',
        'transition-[left,width] duration-300 ease-in-out',
      )}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={toggleMobile}
        className="md:hidden p-2 rounded-lg text-ink-muted hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
        <input
          type="search"
          placeholder="Buscar registros, animales o tareas..."
          className={cn(
            'w-full pl-9 pr-4 py-2 rounded-full text-sm',
            'bg-stone-100 dark:bg-stone-800',
            'text-ink placeholder:text-ink-muted',
            'border-none outline-none',
            'focus:ring-2 focus:ring-world/20 transition-shadow',
          )}
        />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1 ml-auto">
        <WeatherWidget />
        <NotificationsButton />
        <ThemeToggle />

        <div className="w-px h-6 bg-divider mx-2" />

        <button className="p-1 rounded-full text-ink-muted hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
          <CircleUser className="w-7 h-7" />
        </button>
      </div>
    </header>
  )
}
