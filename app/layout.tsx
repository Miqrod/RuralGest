import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Geist } from 'next/font/google'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { Toaster } from 'sonner'
import { cn } from '@/lib/utils'
import '@/styles/globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Hermanos Rodríguez',
  description: 'Gestión ganadera',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={cn('font-sans', geist.variable)} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
