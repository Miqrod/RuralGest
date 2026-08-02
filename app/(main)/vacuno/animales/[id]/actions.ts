'use server'

import { revalidatePath } from 'next/cache'
import { registrarVentaAnimal } from '@/modules/ganadero/animales/application/actions/registrarVentaAnimal'
import { registrarMuerteAnimal } from '@/modules/ganadero/animales/application/actions/registrarMuerteAnimal'
import { registrarCubricion } from '@/modules/ganadero/reproductivo/application/actions/registrarCubricion'
import { confirmarGestacion } from '@/modules/ganadero/reproductivo/application/actions/confirmarGestacion'
import type { TipoCubricion } from '@/modules/ganadero/reproductivo/domain/types'

// Extrae el mensaje de error tanto de Error nativo como de PostgrestError (Supabase),
// que no hereda de Error y por tanto no pasa instanceof.
function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err)
    return String((err as { message: unknown }).message)
  return fallback
}

// Tras éxito: revalidatePath invalida el caché del Server Component de la ficha,
// de forma que el router.refresh() del cliente recibirá datos actualizados.
export async function submitVentaAnimal(
  animalId: string,
  fecha: string,
): Promise<{ error: string } | null> {
  try {
    await registrarVentaAnimal({ animal_id: animalId, fecha_venta: fecha })
    revalidatePath(`/vacuno/animales/${animalId}`)
    return null
  } catch (err) {
    console.error('[submitVentaAnimal]', err)
    return { error: extractMessage(err, 'Error al registrar la venta') }
  }
}

export async function submitMuerteAnimal(
  animalId: string,
  fecha: string,
): Promise<{ error: string } | null> {
  try {
    await registrarMuerteAnimal({ animal_id: animalId, fecha_muerte: fecha })
    revalidatePath(`/vacuno/animales/${animalId}`)
    return null
  } catch (err) {
    console.error('[submitMuerteAnimal]', err)
    return { error: extractMessage(err, 'Error al registrar la muerte') }
  }
}

export async function submitConfirmacionGestacion(
  animalId: string,
  fechaConfirmacion: string,
  mesesGestacionEstimados?: number,
  observaciones?: string,
): Promise<{ error: string } | null> {
  try {
    await confirmarGestacion({
      animal_id:                  animalId,
      fecha_confirmacion:         fechaConfirmacion,
      meses_gestacion_estimados:  mesesGestacionEstimados,
      observaciones,
    })
    revalidatePath(`/vacuno/animales/${animalId}`)
    return null
  } catch (err) {
    console.error('[submitConfirmacionGestacion]', err)
    return { error: extractMessage(err, 'Error al confirmar la gestación') }
  }
}

export async function submitCubricionAnimal(
  animalId: string,
  fechaCubricion: string,
  tipoCubricion: TipoCubricion,
  machoId?: string,
  observaciones?: string,
): Promise<{ error: string } | null> {
  try {
    await registrarCubricion({
      animal_id:       animalId,
      fecha_cubricion: fechaCubricion,
      tipo_cubricion:  tipoCubricion,
      macho_id:        machoId,
      observaciones,
    })
    revalidatePath(`/vacuno/animales/${animalId}`)
    return null
  } catch (err) {
    console.error('[submitCubricionAnimal]', err)
    return { error: extractMessage(err, 'Error al registrar la cubrición') }
  }
}
