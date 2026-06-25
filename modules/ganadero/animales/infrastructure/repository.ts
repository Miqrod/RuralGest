import { createServerClient } from '../../../shared/db'
import { mapAnimalRowToDomain, mapCompraInputToRpcArgs, mapVentaInputToRpcArgs, mapMuerteInputToRpcArgs } from './mapper'
import type { UUID } from '../../../shared/types'
import type { Animal, CrearAnimalInput, RegistrarCompraAnimalInput, RegistrarVentaAnimalInput, RegistrarMuerteAnimalInput } from '../domain/types'

export async function listAnimales(): Promise<Animal[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('animal')
    .select('*, raza(nombre), tipo_productivo(nombre)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as Parameters<typeof mapAnimalRowToDomain>[0][]).map(mapAnimalRowToDomain)
}

export async function getAnimalById(id: UUID): Promise<Animal | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('animal')
    .select('*, raza(nombre), tipo_productivo(nombre)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return mapAnimalRowToDomain(data as Parameters<typeof mapAnimalRowToDomain>[0])
}

export async function getAnimalCrotal(id: UUID): Promise<string | null> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('animal')
    .select('crotal')
    .eq('id', id)
    .maybeSingle()
  return data?.crotal ?? null
}

export async function listAnimalesByLote(_loteId: UUID): Promise<Animal[]> {
  throw new Error('not implemented')
}

export async function insertAnimal(_input: CrearAnimalInput, _eventoId: UUID): Promise<Animal> {
  throw new Error('not implemented')
}

// Persiste el registro completo de una compra de animal mediante RPC transaccional.
// El RPC registrar_compra_animal ejecuta en una única transacción Postgres:
//   INSERT eventos → INSERT animal → INSERT evento_animales
// Devuelve el UUID del animal; hidratamos con getAnimalById para obtener el Animal completo.
export async function insertarCompraAnimal(
  input: RegistrarCompraAnimalInput,
): Promise<Animal> {
  const supabase = await createServerClient()

  const { data: animalId, error } = await supabase
    .rpc('registrar_compra_animal', mapCompraInputToRpcArgs(input))
  if (error) throw error

  const animal = await getAnimalById(animalId as UUID)
  if (!animal) throw new Error(`Animal creado no encontrado tras RPC: ${animalId}`)
  return animal
}

// Persiste una salida por venta mediante RPC transaccional.
// Devuelve el UUID del evento creado.
export async function insertarVentaAnimal(input: RegistrarVentaAnimalInput): Promise<UUID> {
  const supabase = await createServerClient()
  const { data: eventoId, error } = await supabase
    .rpc('registrar_salida_animal', mapVentaInputToRpcArgs(input))
  if (error) throw error
  return eventoId as UUID
}

// Persiste una salida por muerte mediante RPC transaccional.
// Devuelve el UUID del evento creado.
export async function insertarMuerteAnimal(input: RegistrarMuerteAnimalInput): Promise<UUID> {
  const supabase = await createServerClient()
  const { data: eventoId, error } = await supabase
    .rpc('registrar_salida_animal', mapMuerteInputToRpcArgs(input))
  if (error) throw error
  return eventoId as UUID
}
