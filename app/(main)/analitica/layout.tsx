import type { ReactNode } from 'react'
import { PageContainerWide } from '@/components/layout/PageContainer'
import { AnaliticaNav } from './AnaliticaNav'

export default function AnaliticaLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainerWide>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-world mb-1">Analítica</h1>
        <p className="text-sm text-ink-muted mb-5">
          Indicadores y evolución de los principales ámbitos de la explotación.
        </p>
        <AnaliticaNav />
      </div>
      {children}
    </PageContainerWide>
  )
}
