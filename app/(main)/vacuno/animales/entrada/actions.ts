'use server'

import { redirect } from 'next/navigation'
import { registrarCompraAnimal } from '@/modules/ganadero/animales/application/actions/registrarCompraAnimal'
import type { RegistrarCompraAnimalInput } from '@/modules/ganadero/animales/domain/types'

// Server Action invocada por el formulario cliente.
// Recibe los datos del formulario, ejecuta el use case y redirige a la ficha del animal creado.
// En caso de error de validación devuelve un objeto de error para que el formulario lo muestre.
export async function submitEntradaCompra(
  input: RegistrarCompraAnimalInput,
): Promise<{ error: string } | never> {
  let id: string
  try {
    const result = await registrarCompraAnimal(input)
    id = result.id
  } catch (err) {
    console.error('[submitEntradaCompra]', err)
    // PostgrestError (Supabase) no es instanceof Error — extraemos .message explícitamente
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Error al registrar la entrada'
    return { error: message }
  }
  // redirect() lanza internamente: no puede estar dentro del catch
  redirect(`/vacuno/animales/${id}`)
}
