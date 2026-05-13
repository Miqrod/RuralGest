'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/lib/navigation'
import { siteConfig } from '@/lib/config'
import { useSidebar } from '@/providers/SidebarProvider'
import type { NavItem, WorldId } from '@/types/navigation'

// Clases estáticas por mundo — Tailwind las detecta en build time
const WORLD_ACTIVE: Record<WorldId, string> = {
  default:    'text-nav-default    border-nav-default',
  vacuno:     'text-nav-vacuno     border-nav-vacuno',
  porcino:    'text-nav-porcino    border-nav-porcino',
  financiero: 'text-nav-financiero border-nav-financiero',
}
const WORLD_HOVER: Record<WorldId, string> = {
  default:    'hover:text-nav-default    hover:border-nav-default',
  vacuno:     'hover:text-nav-vacuno     hover:border-nav-vacuno',
  porcino:    'hover:text-nav-porcino    hover:border-nav-porcino',
  financiero: 'hover:text-nav-financiero hover:border-nav-financiero',
}
// Text-only variants for sub-items (no border needed)
const WORLD_TEXT: Record<WorldId, string> = {
  default:    'text-nav-default',
  vacuno:     'text-nav-vacuno',
  porcino:    'text-nav-porcino',
  financiero: 'text-nav-financiero',
}
const WORLD_HOVER_TEXT: Record<WorldId, string> = {
  default:    'hover:text-nav-default',
  vacuno:     'hover:text-nav-vacuno',
  porcino:    'hover:text-nav-porcino',
  financiero: 'hover:text-nav-financiero',
}
// Group-hover variant for the sub-item arrow (driven by named group on the parent link)
const WORLD_ARROW_HOVER: Record<WorldId, string> = {
  default:    'group-hover/subitem:text-nav-default',
  vacuno:     'group-hover/subitem:text-nav-vacuno',
  porcino:    'group-hover/subitem:text-nav-porcino',
  financiero: 'group-hover/subitem:text-nav-financiero',
}

// ── Logo ────────────────────────────────────────────────────────────────────

function SiteLogo({ collapsed }: { collapsed: boolean }) {
  const FallbackIcon = siteConfig.logoFallback

  const logoEl = siteConfig.logoUrl ? (
    <Image
      src={siteConfig.logoUrl}
      alt={siteConfig.name}
      width={40}
      height={40}
      className="w-10 h-10 rounded-lg object-cover"
    />
  ) : (
    <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center shrink-0 shadow-md">
      <FallbackIcon className="w-6 h-6 text-brand-on" />
    </div>
  )

  return (
    <div className={cn('flex items-center gap-3 h-16 px-3 shrink-0', collapsed && 'justify-center')}>
      {logoEl}
      {!collapsed && (
        <span className="text-[17px] font-black tracking-tight text-brand leading-tight">
          {siteConfig.name}
        </span>
      )}
    </div>
  )
}

// ── Nav row ──────────────────────────────────────────────────────────────────

function NavRow({
  item,
  pathname,
  collapsed,
  depth = 0,
}: {
  item: NavItem
  pathname: string
  collapsed: boolean
  depth?: number
}) {
  const { toggle } = useSidebar()
  const hasChildren = !!item.children?.length
  const isActive = item.href
    ? item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
    : false
  const isChildActive = hasChildren && item.children!.some((c) => c.href && pathname.startsWith(c.href))
  const [open, setOpen] = useState(isChildActive)

  const Icon = item.icon
  const highlighted = isActive || isChildActive

  const topLevelBase = cn(
    'w-full flex items-center gap-3 pl-4 pr-4 py-2 text-sm font-medium',
    'transition-[color,background-color,border-color] duration-200 ease-in',
    highlighted
      ? ['border-l-4 bg-stone-200 dark:bg-stone-800', WORLD_ACTIVE[item.world]]
      : ['text-ink-muted border-l-4 border-transparent hover:bg-stone-100 dark:hover:bg-stone-800', WORLD_HOVER[item.world]],
  )

  // Collapsed: icono + tooltip; si tiene hijos, expandir sidebar al hacer click
  if (collapsed) {
    const collapsedCls = cn(
      'w-full flex items-center justify-center py-2 px-0',
      'transition-[color,background-color,border-color] duration-200 ease-in',
      highlighted
        ? ['border-l-4 bg-stone-200 dark:bg-stone-800', WORLD_TEXT[item.world]]
        : ['text-ink-muted border-l-4 border-transparent hover:bg-stone-100 dark:hover:bg-stone-800', WORLD_HOVER[item.world]],
    )
    return (
      <Tooltip>
        <TooltipTrigger
          render={item.href && !hasChildren ? <Link href={item.href} /> : <button />}
          onClick={hasChildren ? () => { toggle(); setOpen(true) } : undefined}
          className={collapsedCls}
        >
          <Icon className="w-5 h-5 shrink-0" />
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  // Sub-ítem (depth > 0): texto solamente, sin icono, con flecha en hover y activo
  if (depth > 0) {
    if (!item.href) return null
    return (
      <Link
        href={item.href}
        className={cn(
          'group/subitem relative flex items-center pl-11 pr-4 py-2 text-sm',
          'transition-colors duration-200 ease-in',
          isActive
            ? ['font-semibold', WORLD_TEXT[item.world]]
            : ['text-ink-muted', WORLD_HOVER_TEXT[item.world]],
        )}
      >
        <span
          className={cn(
            'absolute left-6 text-lg leading-none transition-colors duration-200 ease-in',
            isActive
              ? WORLD_TEXT[item.world]
              : cn('text-transparent', WORLD_ARROW_HOVER[item.world]),
          )}
        >▸</span>
        {item.label}
      </Link>
    )
  }

  // Top-level con hijos: acordeón
  if (hasChildren) {
    return (
      <div>
        <button onClick={() => setOpen((o) => !o)} className={cn(topLevelBase)}>
          <Icon className="w-5 h-5 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {open
            ? <ChevronDown className="w-4 h-4 shrink-0" />
            : <ChevronRight className="w-4 h-4 shrink-0" />
          }
        </button>
        <div
          className={cn(
            'overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out',
            open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <div className="bg-stone-100/50 dark:bg-stone-800/50 py-1">
            {item.children!.map((child) => (
              <NavRow key={child.href ?? child.label} item={child} pathname={pathname} collapsed={false} depth={depth + 1} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Top-level hoja: link
  return (
    <Link href={item.href!} className={cn(topLevelBase)}>
      <Icon className="w-5 h-5 shrink-0" />
      <span>{item.label}</span>
    </Link>
  )
}

// ── Mobile close button ──────────────────────────────────────────────────────

type ClosePhase = 'offscreen' | 'entering' | 'settled' | 'fading'

function MobileCloseBtn({ closeMobile, mobileOpen }: { closeMobile: () => void; mobileOpen: boolean }) {
  const [phase, setPhase] = useState<ClosePhase>('offscreen')

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    if (mobileOpen) {
      // Wait for sidebar to enter (300ms) + extra margin, then slide X down
      timers.push(setTimeout(() => {
        setPhase('entering')
        // After entrance animation (400ms), switch to settled for hover transitions
        timers.push(setTimeout(() => setPhase('settled'), 400))
      }, 500))
    } else {
      setPhase('fading')
      // After fade out (200ms), reset position off-screen instantly
      timers.push(setTimeout(() => setPhase('offscreen'), 220))
    }
    return () => timers.forEach(clearTimeout)
  }, [mobileOpen])

  return (
    <button
      onClick={closeMobile}
      aria-label="Cerrar menú"
      className={cn(
        'absolute top-[14px] left-[calc(100%+12px)]',
        'md:hidden cursor-pointer',
        'w-9 h-9 rounded-full shadow-lg',
        'bg-surface-base text-world',
        'hover:bg-world hover:text-surface-base',
        'flex items-center justify-center',
        'hover:scale-110 active:scale-95',
        // offscreen: off-screen above, no transition, not clickable
        phase === 'offscreen' && '-translate-y-16 pointer-events-none',
        // entering: slides down into place (400ms)
        phase === 'entering' && 'translate-y-0 transition-[translate] duration-[400ms] ease-in',
        // settled: fully visible, hover transitions at 200ms
        phase === 'settled' && 'translate-y-0 transition-[background-color,color,scale] duration-200 ease-in',
        // fading: fade out only, no vertical movement
        phase === 'fading' && 'translate-y-0 opacity-0 transition-opacity duration-200 ease-in pointer-events-none',
      )}
    >
      <X className="w-5 h-5" />
    </button>
  )
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname()
  const { collapsed, toggle, mobileOpen, closeMobile } = useSidebar()

  // When the mobile drawer is open, always show expanded (labels visible)
  const displayCollapsed = !mobileOpen && collapsed

  // Close mobile drawer on navigation
  useEffect(() => {
    closeMobile()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-50 flex flex-col',
          'bg-surface-base dark:bg-stone-900',
          'border-r-[6px] border-world',
          'transition-[width,translate] duration-300 ease-in-out',
          // Desktop width
          collapsed ? 'md:w-16' : 'md:w-64',
          // Mobile: always full width, slide in/out
          'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <SiteLogo collapsed={displayCollapsed} />

        <MobileCloseBtn closeMobile={closeMobile} mobileOpen={mobileOpen} />

        <nav className="flex-1 overflow-y-auto py-3 mx-1 flex flex-col gap-1">
          {NAV_ITEMS.filter((item) => !item.hidden).map((item) => (
            <NavRow key={item.href ?? item.label} item={item} pathname={pathname} collapsed={displayCollapsed} />
          ))}
        </nav>

        <div className="shrink-0 border-t border-divider p-2 hidden md:block">
          <Tooltip>
            <TooltipTrigger
              onClick={toggle}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2',
                'text-ink-muted hover:bg-stone-100 dark:hover:bg-stone-800',
                'transition-colors duration-150 text-sm font-medium',
                collapsed && 'justify-center',
              )}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-5 h-5 shrink-0" />
              ) : (
                <>
                  <PanelLeftClose className="w-5 h-5 shrink-0" />
                  <span>Colapsar menú</span>
                </>
              )}
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Expandir menú</TooltipContent>}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
