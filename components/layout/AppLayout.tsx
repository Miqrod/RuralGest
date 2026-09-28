'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SidebarProvider, useSidebar } from '@/providers/SidebarProvider'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Footer } from './Footer'
import { WorldSync } from './WorldSync'

const SIDEBAR_W_EXPANDED = 'md:pl-64'
const SIDEBAR_W_COLLAPSED = 'md:pl-16'

function MobileBackdrop() {
  const { mobileOpen, closeMobile } = useSidebar()
  return (
    <div
      onClick={closeMobile}
      className={cn(
        'fixed inset-0 z-[45] bg-black/50 md:hidden',
        'transition-opacity duration-300',
        mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      )}
      aria-hidden
    />
  )
}

function AppShell({ children, logoUrl }: { children: ReactNode; logoUrl?: string }) {
  const { collapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-surface-base">
      <WorldSync />
      <MobileBackdrop />
      <Sidebar logoUrl={logoUrl} />
      <Header />

      <main
        className={cn(
          'min-h-screen flex flex-col',
          'pt-16 pb-10',
          'transition-[padding-left] duration-300 ease-in-out',
          collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED,
        )}
      >
        {children}
      </main>

      <Footer />
    </div>
  )
}

export function AppLayout({ children, logoUrl }: { children: ReactNode; logoUrl?: string }) {
  return (
    <SidebarProvider>
      <AppShell logoUrl={logoUrl}>{children}</AppShell>
    </SidebarProvider>
  )
}
