'use server'

import { createServerClient } from '@/modules/shared/db'

// Registra múltiples hembras como machorras en una única operación atómica.
// Delega en el RPC registrar_machorra_animales, que garantiza rollback total ante cualquier fallo.
export async function submitMachorraAnimales(
  animalIds: string[]
): Promise<{ error: string } | null> {
  if (!animalIds.length) return { error: 'No se han seleccionado animales' }

  const supabase = await createServerClient()
  const { error } = await supabase.rpc('registrar_machorra_animales', {
    p_animal_ids: animalIds,
  })

  if (error) return { error: error.message }
  return null
}
