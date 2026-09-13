import type { UUID } from '../../../../shared/types'
import type { AnimalEnInstalacion } from '../../domain/types'
import { fetchAnimalesEnInstalacion } from '../../infrastructure/repository'

export async function getAnimalesEnInstalacion(instalacionId: UUID): Promise<AnimalEnInstalacion[]> {
  return fetchAnimalesEnInstalacion(instalacionId)
}
