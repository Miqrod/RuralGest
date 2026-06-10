import Link from 'next/link'
import { PageContainer } from '@/components/layout/PageContainer'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FormEntradaCompra } from '@/modules/ganadero/animales/ui/entrada/FormEntradaCompra'

// Página contenedor: solo coordina layout y delega al formulario.
// Los datos de catálogo (razas, tipos productivos) se cargarán aquí
// y se pasarán como props al formulario cuando se implemente en Tarea 48.
export default function EntradaAnimalPage() {
  return (
    <PageContainer>
      <div className="mb-6 flex items-center gap-3">
        {/* Volver al listado — link semántico, no botón */}
        <Link
          href="/vacuno/animales"
          className={cn(buttonVariants({ variant: 'outline' }), 'h-auto py-2 px-4')}
        >
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold text-world">Registrar entrada animal</h1>
      </div>

      <FormEntradaCompra />
    </PageContainer>
  )
}
