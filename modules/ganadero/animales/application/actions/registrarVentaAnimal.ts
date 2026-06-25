import type { RegistrarVentaAnimalInput } from '../../domain/types'
import { assertAnimalPuedeSalir } from '../../domain/rules'
import { getAnimalById, insertarVentaAnimal } from '../../infrastructure/repository'

export type { RegistrarVentaAnimalInput }

// Punto de entrada para la UI. Nunca llamar a insertarVentaAnimal directamente desde UI.
// Primera línea de validación: carga el animal y verifica estado_vital antes del RPC.
// El RPC añade una segunda validación con FOR UPDATE dentro de la transacción.
// Devuelve el evento_id creado.
export async function registrarVentaAnimal(
  input: RegistrarVentaAnimalInput,
): Promise<{ eventoId: string }> {
  const animal = await getAnimalById(input.animal_id)
  if (!animal) throw new Error(`Animal no encontrado: ${input.animal_id}`)

  assertAnimalPuedeSalir(animal)

  const eventoId = await insertarVentaAnimal(input)
  return { eventoId }
}
