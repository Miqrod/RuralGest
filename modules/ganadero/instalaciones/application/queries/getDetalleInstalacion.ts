import type { UUID } from '../../../../shared/types'
import type { InstalacionDetalle } from '../../domain/types'
import { fetchInstalacionDetalle } from '../../infrastructure/repository'

export async function getDetalleInstalacion(id: UUID): Promise<InstalacionDetalle | null> {
  return fetchInstalacionDetalle(id)
}
