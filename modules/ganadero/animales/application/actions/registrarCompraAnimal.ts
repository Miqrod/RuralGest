import type { RegistrarCompraAnimalInput } from '../../domain/types'
import { insertarCompraAnimal } from '../../infrastructure/repository'

export type { RegistrarCompraAnimalInput }

// Crotal español: 2 letras (código país) + 12 dígitos. Ej: ES001234567890
export function isValidCrotalFormat(crotal: string): boolean {
  return /^[A-Z]{2}\d{12}$/.test(crotal)
}

export function validateRegistrarCompraAnimal(input: RegistrarCompraAnimalInput): void {
  if (input.crotal !== undefined && !isValidCrotalFormat(input.crotal)) {
    throw new Error(
      `Crotal inválido: "${input.crotal}". Formato esperado: 2 letras + 12 dígitos (ej. ES001234567890)`
    )
  }

  if (input.fecha_nacimiento !== undefined && input.fecha_nacimiento_estimada !== undefined) {
    throw new Error('No se puede indicar fecha de nacimiento exacta y estimada simultáneamente')
  }

  const fechaNac = input.fecha_nacimiento ?? input.fecha_nacimiento_estimada
  if (fechaNac !== undefined && fechaNac > input.fecha_compra) {
    throw new Error('La fecha de nacimiento no puede ser posterior a la fecha de compra')
  }
}

// Punto de entrada para la UI. Nunca llamar a insertarCompraAnimal directamente desde UI.
// Valida primero para no gastar una llamada a DB con datos inválidos.
// Devuelve solo el id: la UI lo usa para redirigir a la ficha; no necesita el Animal completo.
export async function registrarCompraAnimal(
  input: RegistrarCompraAnimalInput,
): Promise<{ id: string }> {
  validateRegistrarCompraAnimal(input)
  const animal = await insertarCompraAnimal(input)
  return { id: animal.id }
}
