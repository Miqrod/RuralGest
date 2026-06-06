import Link from 'next/link'
import { PageContainer } from '@/components/layout/PageContainer'

export default function AnimalNotFound() {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm font-medium text-ink mb-1">
          Animal no encontrado
        </p>
        <p className="text-sm text-ink-muted mb-6">
          El animal que buscas no existe o ha sido eliminado.
        </p>
        <Link
          href="/vacuno/animales"
          className="text-sm text-world hover:underline underline-offset-2"
        >
          ← Volver a la lista
        </Link>
      </div>
    </PageContainer>
  )
}
