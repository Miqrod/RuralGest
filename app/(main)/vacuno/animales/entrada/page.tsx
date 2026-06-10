import Link from 'next/link'
import { PageContainer } from '@/components/layout/PageContainer'
import { FormEntradaCompra } from '@/modules/ganadero/animales/ui/entrada/FormEntradaCompra'

// Página contenedor: solo coordina layout y delega al formulario.
// Los datos de catálogo (razas, tipos productivos) se cargarán aquí
// y se pasarán como props al formulario cuando se implemente en Tarea 48.
export default function EntradaAnimalPage() {
  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-world">Registrar entrada animal</h1>
        <Link
          href="/vacuno/animales"
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors"
        >
          ← Volver a animales
        </Link>
      </div>

      <FormEntradaCompra />
    </PageContainer>
  )
}
