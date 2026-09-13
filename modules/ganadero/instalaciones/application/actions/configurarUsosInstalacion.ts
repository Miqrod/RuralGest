import type { ConfigurarUsosInstalacionInput } from '../../domain/types'
import { updateInstalacionUsos } from '../../infrastructure/repository'

export type { ConfigurarUsosInstalacionInput }

export async function configurarUsosInstalacion(input: ConfigurarUsosInstalacionInput): Promise<void> {
  await updateInstalacionUsos(input)
}
