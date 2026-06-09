import type { UUID, ISODate } from '../../../../shared/types'
import type { Especie, Sexo } from '../../../shared/domain/types'

export interface RegistrarCompraAnimalInput {
  // Identidad del animal
  especie: Especie
  sexo: Sexo
  tipo_productivo_id: UUID
  crotal?: string
  num_hierro?: string
  raza_id?: UUID
  fecha_nacimiento?: ISODate
  fecha_nacimiento_estimada?: ISODate
  // Datos de la compra
  fecha_compra: ISODate
  // Asignación inicial (opcional)
  lote_id?: UUID
}

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

export async function registrarCompraAnimal(
  input: RegistrarCompraAnimalInput,
): Promise<{ id: UUID }> {
  validateRegistrarCompraAnimal(input)
  throw new Error('not implemented')
}
