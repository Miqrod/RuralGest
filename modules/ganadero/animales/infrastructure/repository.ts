import { createServerClient } from '../../../shared/db'
import { mapAnimalRowToDomain } from './mapper'
import type { UUID } from '../../../shared/types'
import type { Animal, CrearAnimalInput } from '../domain/types'

export async function listAnimales(): Promise<Animal[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('animal').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data.map(mapAnimalRowToDomain)
}

export async function getAnimalById(_id: UUID): Promise<Animal | null> {
  throw new Error('not implemented')
}

export async function listAnimalesByLote(_loteId: UUID): Promise<Animal[]> {
  throw new Error('not implemented')
}

export async function insertAnimal(_input: CrearAnimalInput, _eventoId: UUID): Promise<Animal> {
  throw new Error('not implemented')
}
