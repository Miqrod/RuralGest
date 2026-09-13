import type { InstalacionListItem } from '../../domain/types'
import { fetchInstalaciones } from '../../infrastructure/repository'

export async function listarInstalaciones(): Promise<InstalacionListItem[]> {
  return fetchInstalaciones()
}
