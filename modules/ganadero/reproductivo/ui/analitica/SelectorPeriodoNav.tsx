'use client'

import { useRouter } from 'next/navigation'
import { SelectorPeriodo } from './SelectorPeriodo'
import type { PeriodoAnalisis } from '../../domain/analytics'

// Wrapper cliente de SelectorPeriodo: serializa el periodo en los search params
// de la URL para que la página Server Component re-fetche los datos.
export function SelectorPeriodoNav({ value }: { value: PeriodoAnalisis }) {
  const router = useRouter()

  function handleChange(periodo: PeriodoAnalisis) {
    const params = new URLSearchParams()
    params.set('desde', periodo.desde)
    params.set('hasta', periodo.hasta)
    params.set('preset', periodo.preset)
    // scroll: false evita que Next.js haga scroll top al actualizar los search params
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return <SelectorPeriodo value={value} onChange={handleChange} />
}
