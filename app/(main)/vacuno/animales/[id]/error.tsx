'use client'

import { PageContainer } from '@/components/layout/PageContainer'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AnimalDetailError({ reset }: Props) {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm font-medium text-ink mb-1">
          No se pudo cargar la ficha del animal
        </p>
        <p className="text-sm text-ink-muted mb-6">
          Ha ocurrido un error inesperado. Puedes intentarlo de nuevo.
        </p>
        <button
          onClick={reset}
          className="text-sm text-world hover:underline underline-offset-2"
        >
          Volver a intentar
        </button>
      </div>
    </PageContainer>
  )
}
