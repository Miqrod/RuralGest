import { format } from 'date-fns'
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

  // Fecha local del servidor, no toISOString(): este último da el día UTC y,
  // entre la medianoche de Madrid y la UTC, rechazaba la fecha de hoy como futura.
  // La zona del servidor está garantizada por instrumentation.ts.
  if (input.fecha > format(new Date(), 'yyyy-MM-dd')) {
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
