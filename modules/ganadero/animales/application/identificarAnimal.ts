import { getAnimalById } from '../infrastructure/repository'
import { evaluarIdentificacion } from '../domain/IdentificationRules'
import type { AnimalIdentificationStatus } from '../domain/IdentificationRules'
import { buildIdentificationStatus } from '../domain/IdentificationRules'
import { createServerClient } from '../../../shared/db'
import type { UUID } from '../../../shared/types'
import type { Sexo } from '../../shared/domain/types'

export interface IdentificarAnimalInput {
  animal_id:   UUID
  crotal?:     string
  sexo?:       NonNullable<Sexo>    // macho | hembra — el usuario lo selecciona explícitamente
  num_hierro?: string
  nombre?:     string
  // fecha_nacimiento NO se expone: la establece el sistema al registrar el parto
  // y no debe modificarse manualmente para evitar inconsistencias con el evento origen
}

// Actualiza los datos de identificación de una cría y recalcula su estado.
// Solo aplica a animales nacidos de un parto registrado (estado_identificacion !== null).
// El nuevo estado_identificacion lo determina el dominio — nunca el cliente.
export async function identificarAnimal(
  input: IdentificarAnimalInput,
): Promise<AnimalIdentificationStatus> {
  const animal = await getAnimalById(input.animal_id)
  if (!animal) throw new Error(`Animal no encontrado: ${input.animal_id}`)

  // Identificación solo aplica a crías originadas por un parto registrado
  if (animal.estado_identificacion === null) {
    throw new Error('Este animal no está sujeto al workflow de identificación')
  }

  // Calcular el nuevo estado aplicando los valores entrantes sobre el snapshot actual
  const datosActualizados = {
    crotal: input.crotal ?? animal.crotal,
    sexo:   input.sexo   ?? animal.sexo,
  }
  const result = evaluarIdentificacion(datosActualizados)
  const nuevoEstado = result.completa ? 'completa' : 'pendiente'

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('animal')
    .update({
      estado_identificacion: nuevoEstado,
      ...(input.crotal     !== undefined && { crotal:     input.crotal }),
      ...(input.sexo       !== undefined && { sexo:       input.sexo }),
      ...(input.num_hierro !== undefined && { num_hierro: input.num_hierro }),
      ...(input.nombre     !== undefined && { nombre:     input.nombre }),
    })
    .eq('id', input.animal_id)
  if (error) throw error

  return buildIdentificationStatus(datosActualizados)
}
