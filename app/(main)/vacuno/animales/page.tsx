import Link from 'next/link'
import { PageContainer } from '@/components/layout/PageContainer'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { listarAnimales } from '@/modules/ganadero/animales/application/queries/listarAnimales'
import { AnimalesTable } from './AnimalesTable'

export default async function AnimalesPage() {
  const animales = await listarAnimales()

  return (
    <PageContainer>
      {/* Cabecera: título + acción principal */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-world">Animales</h1>
          <p className="text-sm text-ink-muted mt-1">{animales.length} animales en el sistema</p>
        </div>
        {/* Link estilado como botón: semántica <a> correcta para navegación.
            h-auto libera la altura fija del variant para que py-2 px-6 tengan efecto. */}
        <Link href="/vacuno/animales/entrada" className={cn(buttonVariants(), 'h-auto py-3 px-8')}>
          Registrar entrada
        </Link>
      </div>

      <AnimalesTable data={animales} />
    </PageContainer>
  )
}
