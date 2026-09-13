import type { RegistrarReubicacionAnimalesInput, ReubicacionResult } from '../../domain/types'
import { rpcRegistrarReubicacion } from '../../infrastructure/repository'

export type { RegistrarReubicacionAnimalesInput, ReubicacionResult }

export function validateRegistrarReubicacion(input: RegistrarReubicacionAnimalesInput): void {
  if (input.animal_ids.length === 0) {
    throw new Error('Selecciona al menos un animal para reubicar')
  }

  const unicos = new Set(input.animal_ids)
  if (unicos.size !== input.animal_ids.length) {
    throw new Error('La lista de animales contiene identificadores duplicados')
  }

  if (input.fecha > new Date().toISOString().slice(0, 10)) {
    throw new Error('La fecha de reubicación no puede ser futura')
  }
}

// El RPC registrar_reubicacion_animales valida también en DB:
//   - destino activo y admite_animales
//   - animales vivos y no ya en destino
//   - coherencia temporal de CAMBIO_UBICACION
// Los errores de DB se propagan como excepciones a la UI.
export async function registrarReubicacionAnimales(
  input: RegistrarReubicacionAnimalesInput,
): Promise<ReubicacionResult> {
  validateRegistrarReubicacion(input)
  return rpcRegistrarReubicacion(input)
}
