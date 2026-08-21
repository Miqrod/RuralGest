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

// Devuelve true si el crotal tiene el formato correcto. El campo es opcional:
// no rellenarlo no es un error — tenerlo con formato incorrecto sí lo es.
export function isValidCrotalFormat(crotal: string): boolean {
  return CROTAL_REGEX.test(crotal.trim())
}

const CRITERIOS: Array<{
  nombre: string
  cumplido: (a: AnimalIdentificationInput) => boolean
}> = [
  {
    nombre: 'crotal',
    cumplido: (a) => a.crotal !== null && CROTAL_REGEX.test(a.crotal.trim()),
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
