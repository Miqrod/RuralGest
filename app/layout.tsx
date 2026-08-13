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
          <Toaster
            position="top-center"
            toastOptions={{
              classNames: {
                // justify-center centra el grupo icono+texto horizontalmente
                toast:   '!justify-center',
                // !text-white en success/error propaga color al SVG via currentColor
                success: '!bg-green-600 !border-green-600 !text-white',
                error:   '!bg-red-600   !border-red-600   !text-white',
                title:       '!text-white',
                description: '!text-white/90',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
