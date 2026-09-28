import type { ReactNode } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { getExplotacion } from '@/modules/ganadero/explotacion/application/queries/getExplotacion'

export default async function MainLayout({ children }: { children: ReactNode }) {
  const explotacion = await getExplotacion()
  // updated_at como cache-buster: fuerza recarga de imagen en el navegador cuando cambia el logo
  const logoUrl = explotacion?.logo_storage_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${explotacion.logo_storage_path}?v=${encodeURIComponent(explotacion.updated_at ?? '')}`
    : undefined

  return <AppLayout logoUrl={logoUrl}>{children}</AppLayout>
}
