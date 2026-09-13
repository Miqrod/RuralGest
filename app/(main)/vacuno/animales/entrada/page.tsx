import Link from 'next/link'
import { PageContainer } from '@/components/layout/PageContainer'
import { listarRazas } from '@/modules/ganadero/animales/application/queries/listarRazas'
import { listarTiposProductivos } from '@/modules/ganadero/animales/application/queries/listarTiposProductivos'
import { listarInstalaciones } from '@/modules/ganadero/instalaciones/application/queries/listarInstalaciones'
import { FormEntradaCompra } from '@/modules/ganadero/animales/ui/entrada/FormEntradaCompra'

// Los catálogos se resuelven aquí (Server Component) y se pasan al formulario cliente.
// El formulario no hace fetch propio: recibe los datos ya listos.
export default async function EntradaAnimalPage() {
  const [razas, tiposProductivos, todasInstalaciones] = await Promise.all([
    listarRazas('vacuno'),
    listarTiposProductivos('vacuno'),
    listarInstalaciones(),
  ])

  // Solo instalaciones activas que admiten animales — el selector no debe ofrecer destinos inválidos
  const instalaciones = todasInstalaciones.filter((i) => i.activo && i.admite_animales)

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

      <FormEntradaCompra razas={razas} tiposProductivos={tiposProductivos} instalaciones={instalaciones} />
    </PageContainer>
  )
}
