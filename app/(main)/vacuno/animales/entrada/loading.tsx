import { PageContainer } from '@/components/layout/PageContainer'

export default function EntradaAnimalLoading() {
  return (
    <PageContainer>
      <div className="animate-pulse">
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-56 bg-surface-alt rounded" />
          <div className="h-4 w-28 bg-surface-alt rounded" />
        </div>

        {/* Tarjeta de formulario */}
        <div className="bg-canvas rounded-xl border border-divider/20 shadow-sm p-8 space-y-8">
          {/* Fila identificadores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="h-3 w-16 bg-surface-alt rounded" />
              <div className="h-10 bg-surface-alt rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-28 bg-surface-alt rounded" />
              <div className="h-10 bg-surface-alt rounded-lg" />
            </div>
            <div />
          </div>

          {/* Fila características */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 bg-surface-alt rounded" />
                <div className="h-10 bg-surface-alt rounded-lg" />
              </div>
            ))}
          </div>

          {/* Fila fecha nacimiento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="h-3 w-32 bg-surface-alt rounded" />
              <div className="h-10 bg-surface-alt rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-20 bg-surface-alt rounded" />
              <div className="h-10 bg-surface-alt rounded-lg" />
            </div>
          </div>

          {/* Fila fecha compra */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="h-3 w-28 bg-surface-alt rounded" />
              <div className="h-10 bg-surface-alt rounded-lg" />
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-8 flex justify-end gap-4">
          <div className="h-12 w-28 bg-surface-alt rounded-lg" />
          <div className="h-12 w-36 bg-surface-alt rounded-lg" />
        </div>
      </div>
    </PageContainer>
  )
}
