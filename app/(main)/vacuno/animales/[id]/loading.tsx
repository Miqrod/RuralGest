import { PageContainer } from '@/components/layout/PageContainer'

export default function AnimalDetailLoading() {
  return (
    <PageContainer>
      <div className="animate-pulse">
        {/* Back link */}
        <div className="h-4 w-32 bg-surface-alt rounded mb-6" />

        {/* Cabecera */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="h-8 w-40 bg-surface-alt rounded" />
            <div className="h-6 w-16 bg-surface-alt rounded-full" />
          </div>
          <div className="flex gap-2 mt-3">
            <div className="h-5 w-14 bg-surface-alt rounded-full" />
            <div className="h-5 w-20 bg-surface-alt rounded-full" />
          </div>
        </div>

        {/* Secciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-divider bg-surface-base p-5">
            <div className="h-3 w-16 bg-surface-alt rounded mb-4" />
            <div className="space-y-3">
              <div className="h-8 bg-surface-alt rounded" />
              <div className="h-8 bg-surface-alt rounded" />
              <div className="h-8 bg-surface-alt rounded" />
            </div>
          </div>
          <div className="rounded-lg border border-divider bg-surface-base p-5">
            <div className="h-3 w-12 bg-surface-alt rounded mb-4" />
            <div className="space-y-3">
              <div className="h-8 bg-surface-alt rounded" />
              <div className="h-8 bg-surface-alt rounded" />
              <div className="h-8 bg-surface-alt rounded" />
              <div className="h-8 bg-surface-alt rounded" />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
