import { createServerClient } from '../../../../shared/db'
import type { UUID } from '../../../../shared/types'

// Comprueba si el animal tiene al menos un ciclo reproductivo registrado (abierto o cerrado).
// Usado en la ficha para decidir si mostrar el carrusel incluso cuando el animal
// ya no es reproductora (estado_reproductivo = null).
export async function tieneCiclosReproductivos(animalId: UUID): Promise<boolean> {
  const supabase = await createServerClient()
  const { count } = await supabase
    .from('ciclo_reproductivo')
    .select('*', { count: 'exact', head: true })
    .eq('animal_id', animalId)
  return (count ?? 0) > 0
}
