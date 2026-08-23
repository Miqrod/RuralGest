import * as z from 'zod'
import type { Animal } from './types'
import type { EstadoIdentificacion } from '../../shared/domain/types'

export interface IdentificationResult {
  completa: boolean
  criteriosFaltantes: string[]
}

export interface AnimalIdentificationStatus {
  estado: EstadoIdentificacion
  criteriosFaltantes: string[]
}

// Tabla de criterios de identificación.
// Añadir una nueva entrada aquí es el único cambio necesario para extender las reglas.
type AnimalIdentificationInput = Pick<Animal, 'crotal' | 'sexo'>

// Formato oficial del crotal: código de país (2 letras) + 12 dígitos numéricos.
// Ejemplo España: ES001234561001. Coincide con el estándar SITRAN y el placeholder del formulario.
export const CROTAL_REGEX = /^[A-Z]{2}\d{12}$/

// Normaliza el crotal antes de validar: elimina espacios y convierte a mayúsculas.
// Usar en el onChange del input para que el usuario no deba escribir en mayúsculas.
export function normalizeCrotal(value: string): string {
  return value.trim().toUpperCase()
}

// Devuelve true si el crotal tiene el formato correcto. El campo es opcional:
// no rellenarlo no es un error — tenerlo con formato incorrecto sí lo es.
export function isValidCrotalFormat(crotal: string): boolean {
  return CROTAL_REGEX.test(normalizeCrotal(crotal))
}

// Fragmento Zod reutilizable para el campo crotal en cualquier formulario.
// Importar en el schema en lugar de reescribir la validación en cada form.
export const crotalZodField = z
  .string()
  .refine(
    (val) => !val || isValidCrotalFormat(val),
    { message: 'Formato inválido. Usa 2 letras de país + 12 dígitos (ej. ES001234567890).' },
  )
  .optional()

const CRITERIOS: Array<{
  nombre: string
  cumplido: (a: AnimalIdentificationInput) => boolean
}> = [
  {
    nombre: 'crotal',
    cumplido: (a) => a.crotal !== null && isValidCrotalFormat(a.crotal),
  },
  {
    nombre: 'sexo',
    // En explotación extensiva el sexo puede desconocerse al nacer (sexo = null).
    // La identificación queda PENDIENTE hasta que el ganadero lo informe.
    cumplido: (a) => a.sexo !== null,
  },
]

// Evalúa si un animal tiene todos los datos requeridos para pasar a COMPLETA.
// Opera únicamente sobre el snapshot en memoria — sin acceso a la BD.
// Llamar desde el Use Case antes de persistir el cambio de estado.
export function evaluarIdentificacion(
  animal: AnimalIdentificationInput,
): IdentificationResult {
  const criteriosFaltantes = CRITERIOS
    .filter((c) => !c.cumplido(animal))
    .map((c) => c.nombre)

  return {
    completa: criteriosFaltantes.length === 0,
    criteriosFaltantes,
  }
}

// Construye el status observable por la UI y el Dashboard.
// Llama internamente a evaluarIdentificacion — no duplicar la lógica fuera.
export function buildIdentificationStatus(
  animal: AnimalIdentificationInput,
): AnimalIdentificationStatus {
  const result = evaluarIdentificacion(animal)

  return {
    estado: result.completa ? 'completa' : 'pendiente',
    criteriosFaltantes: result.criteriosFaltantes,
  }
}
