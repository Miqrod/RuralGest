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

const CRITERIOS: Array<{
  nombre: string
  cumplido: (a: AnimalIdentificationInput) => boolean
}> = [
  {
    nombre: 'crotal',
    // trim para evitar que un string de espacios se considere válido
    cumplido: (a) => a.crotal !== null && a.crotal.trim() !== '',
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
