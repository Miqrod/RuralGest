import { createServerClient } from '../../../shared/db'
import { mapAnimalRowToDomain } from './mapper'
import type { UUID } from '../../../shared/types'
import type { Animal, CrearAnimalInput } from '../domain/types'

export async function listAnimales(): Promise<Animal[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('animal')
    .select('*, raza(nombre)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as Parameters<typeof mapAnimalRowToDomain>[0][]).map(mapAnimalRowToDomain)
}

export async function getAnimalById(id: UUID): Promise<Animal | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('animal')
    .select('*, raza(nombre)')
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
