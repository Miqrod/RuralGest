import { getCriasConVinculoActivo } from '../application/queries/getCriasConVinculoActivo'
import { CriasDependientesWidget } from './CriasDependientesWidget'
import type { UUID } from '@/modules/shared/types'

interface Props {
  animalId:    UUID
  madreCrotal: string | null
}

// Renderiza el widget de crías con vínculo activo si existen; nada en caso contrario.
// Es un Server Component: fetches its own data so the caller (page.tsx) stays clean.
export async function SeccionCriasDependientes({ animalId, madreCrotal }: Props) {
  const crias = await getCriasConVinculoActivo(animalId)
  if (crias.length === 0) return null
  return <CriasDependientesWidget crias={crias} madreCrotal={madreCrotal} />
}
