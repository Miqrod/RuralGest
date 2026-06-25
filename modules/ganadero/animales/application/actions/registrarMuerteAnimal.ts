import type { RegistrarMuerteAnimalInput } from '../../domain/types'
import { assertAnimalPuedeSalir } from '../../domain/rules'
import { getAnimalById, insertarMuerteAnimal } from '../../infrastructure/repository'

export type { RegistrarMuerteAnimalInput }

// Punto de entrada para la UI. Nunca llamar a insertarMuerteAnimal directamente desde UI.
// Primera línea de validación: carga el animal y verifica estado_vital antes del RPC.
// El RPC añade una segunda validación con FOR UPDATE dentro de la transacción.
// Devuelve el evento_id creado.
export async function registrarMuerteAnimal(
  input: RegistrarMuerteAnimalInput,
): Promise<{ eventoId: string }> {
  const animal = await getAnimalById(input.animal_id)
  if (!animal) throw new Error(`Animal no encontrado: ${input.animal_id}`)

  assertAnimalPuedeSalir(animal)

  const eventoId = await insertarMuerteAnimal(input)
  return { eventoId }
}
