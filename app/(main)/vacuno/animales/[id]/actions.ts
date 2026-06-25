'use server'

import { revalidatePath } from 'next/cache'
import { registrarVentaAnimal } from '@/modules/ganadero/animales/application/actions/registrarVentaAnimal'
import { registrarMuerteAnimal } from '@/modules/ganadero/animales/application/actions/registrarMuerteAnimal'

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
