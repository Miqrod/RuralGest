import { createServerClient } from '../../../../shared/db'
import type { UUID } from '../../../../shared/types'

export interface CambiarTipoProductivoInput {
  animal_id:              UUID
  nuevo_tipo_productivo_id: UUID
}

// Invoca el RPC cambiar_tipo_productivo, que es transaccional:
// actualiza tipo_productivo_id + es_reproductora, registra el evento y
// gestiona el ciclo reproductivo (cierre si sale de reproductora, apertura si entra).
export async function cambiarTipoProductivo(input: CambiarTipoProductivoInput): Promise<void> {
  const supabase = await createServerClient()
  const { error } = await supabase.rpc('cambiar_tipo_productivo', {
    p_animal_id:                input.animal_id,
    p_nuevo_tipo_productivo_id: input.nuevo_tipo_productivo_id,
  })
  if (error) throw error
}
