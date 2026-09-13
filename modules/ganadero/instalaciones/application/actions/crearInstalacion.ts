import type { UUID } from '../../../../shared/types'
import type { CrearInstalacionInput } from '../../domain/types'
import { insertInstalacion } from '../../infrastructure/repository'

export type { CrearInstalacionInput }

export function validateCrearInstalacion(input: CrearInstalacionInput): void {
  if (!input.nombre.trim()) {
    throw new Error('El nombre de la instalación no puede estar vacío')
  }
}

export async function crearInstalacion(input: CrearInstalacionInput): Promise<{ id: UUID }> {
  validateCrearInstalacion(input)
  return insertInstalacion(input)
}
