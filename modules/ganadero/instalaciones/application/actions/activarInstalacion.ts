import type { UUID } from '../../../../shared/types'
import { setInstalacionActivo } from '../../infrastructure/repository'

export async function activarInstalacion(id: UUID): Promise<void> {
  await setInstalacionActivo(id, true)
}
