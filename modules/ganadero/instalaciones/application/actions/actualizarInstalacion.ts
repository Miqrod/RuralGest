import type { ActualizarInstalacionInput } from '../../domain/types'
import { updateInstalacion } from '../../infrastructure/repository'

export type { ActualizarInstalacionInput }

export function validateActualizarInstalacion(input: ActualizarInstalacionInput): void {
  const { id: _id, ...campos } = input
  if (Object.keys(campos).length === 0) {
    throw new Error('Se debe indicar al menos un campo a actualizar')
  }
  if (campos.nombre !== undefined && !campos.nombre.trim()) {
    throw new Error('El nombre de la instalación no puede estar vacío')
  }
}

export async function actualizarInstalacion(input: ActualizarInstalacionInput): Promise<void> {
  validateActualizarInstalacion(input)
  await updateInstalacion(input)
}
