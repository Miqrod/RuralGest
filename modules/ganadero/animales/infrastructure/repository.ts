import { createServerClient } from '../../../shared/db'
import { mapAnimalRowToDomain, mapCompraInputToEventoInsert, mapCompraInputToAnimalInsert } from './mapper'
import type { UUID } from '../../../shared/types'
import type { Animal, CrearAnimalInput, RegistrarCompraAnimalInput } from '../domain/types'

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

// Persiste el registro completo de una compra de animal: evento + animal + asociación N:M.
// NOTA: las tres inserciones son secuenciales y no están envueltas en una transacción DB.
// Si una falla tras haberse completado la anterior quedará un registro huérfano.
// Pendiente: reemplazar por una llamada RPC (función Postgres) cuando la integridad
// transaccional sea prioritaria. Ver documentacion/memory/deferred.md.
export async function insertarCompraAnimal(
  input: RegistrarCompraAnimalInput,
): Promise<Animal> {
  const supabase = await createServerClient()

  // Resolvemos en paralelo los IDs de catálogo que necesitan los mappers
  // y el nombre del tipo_productivo para calcular es_reproductora.
  // Estas tablas son datos estructurales del sistema: no cambian durante la petición.
  const [tipoEventoRes, motivoRes, tipoProductivoRes] = await Promise.all([
    supabase.from('tipo_evento').select('id').eq('codigo', 'ENTRADA').single(),
    supabase.from('motivos_movimiento').select('id').eq('nombre', 'compra').single(),
    supabase.from('tipo_productivo').select('nombre').eq('id', input.tipo_productivo_id).single(),
  ])
  if (tipoEventoRes.error)     throw tipoEventoRes.error
  if (motivoRes.error)         throw motivoRes.error
  if (tipoProductivoRes.error) throw tipoProductivoRes.error

  // es_reproductora es un flag interno del backend: true solo para hembras cuyo
  // tipo_productivo se llama exactamente 'Reproductora'. El usuario no lo controla.
  const esReproductora =
    input.sexo === 'hembra' && tipoProductivoRes.data.nombre === 'Reproductora'

  // Paso 1: insertar el evento que registra la entrada en el sistema
  const { data: evento, error: eventoErr } = await supabase
    .from('eventos')
    .insert(mapCompraInputToEventoInsert(input, tipoEventoRes.data.id, motivoRes.data.id))
    .select('id')
    .single()
  if (eventoErr) throw eventoErr

  // Paso 2: insertar el animal enlazado al evento (trazabilidad)
  const { data: animalRow, error: animalErr } = await supabase
    .from('animal')
    .insert(mapCompraInputToAnimalInsert(input, evento.id, esReproductora))
    .select('*, raza(nombre), tipo_productivo(nombre)')
    .single()
  if (animalErr) throw animalErr

  // Paso 3: crear la asociación N:M evento↔animal en evento_animales
  const { error: assocErr } = await supabase
    .from('evento_animales')
    .insert({ evento_id: evento.id, animal_id: animalRow.id })
  if (assocErr) throw assocErr

  return mapAnimalRowToDomain(animalRow as Parameters<typeof mapAnimalRowToDomain>[0])
}
