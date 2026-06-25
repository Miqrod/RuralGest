'use server'

import { registrarCompraAnimal } from '@/modules/ganadero/animales/application/actions/registrarCompraAnimal'
import type { RegistrarCompraAnimalInput } from '@/modules/ganadero/animales/domain/types'

// Devuelve { id } en éxito para que el cliente navegue y muestre el toast.
// Devuelve { error } en fallo para que el formulario lo muestre inline.
export async function submitEntradaCompra(
  input: RegistrarCompraAnimalInput,
): Promise<{ id: string } | { error: string }> {
  try {
    const result = await registrarCompraAnimal(input)
    return { id: result.id }
  } catch (err) {
    console.error('[submitEntradaCompra]', err)
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Error al registrar la entrada'
    return { error: message }
  }
}
