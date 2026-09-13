'use server'

import { registrarReubicacionAnimales } from '@/modules/ganadero/instalaciones/application/actions/registrarReubicacionAnimales'
import type { RegistrarReubicacionAnimalesInput } from '@/modules/ganadero/instalaciones/domain/types'

// Server action compartido por todos los puntos de entrada de reubicación:
// ficha animal, detalle de instalación, dashboard y pantalla global.
// El componente ReubicacionFlow lo recibe como prop para no depender de la capa app.
export async function submitRegistrarReubicacion(
  input: RegistrarReubicacionAnimalesInput,
): Promise<{ error: string } | null> {
  try {
    await registrarReubicacionAnimales(input)
    return null
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al reubicar animales' }
  }
}
