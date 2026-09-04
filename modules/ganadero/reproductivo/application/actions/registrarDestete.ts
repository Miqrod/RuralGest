import { getAnimalById } from '../../../animales/infrastructure/repository'
import { getWeaningBlockers } from '../../domain/rules/ReproductiveEligibilityRules'
import { createServerClient } from '../../../../shared/db'
import type { RegistrarDesteteLoteInput, RegistrarDesteteLoteResult } from '../../domain/types'

// Registra el destete de una o varias crías en una única transacción atómica.
//
// Pipeline:
//   Contexto  → carga cada cría desde la DB
//   Reglas    → getWeaningBlockers por cría (fail-fast antes de tocar la DB)
//   RPC       → registrar_destete_lote ejecuta todo en una transacción Postgres
//
// Si cualquier cría no es elegible (pre-validación TS) o falla en el RPC,
// ninguna queda aplicada. El cicloCerrado del resultado refleja si el ciclo
// histórico de la(s) cría(s) quedó cerrado tras el destete.
export async function registrarDesteteLote(
  input: RegistrarDesteteLoteInput,
): Promise<RegistrarDesteteLoteResult> {
  // 1. Cargar todas las crías y aplicar reglas de elegibilidad antes de la DB
  for (const criaId of input.cria_ids) {
    const cria = await getAnimalById(criaId)
    if (!cria) throw new Error(`Cría no encontrada: ${criaId}`)

    const blockers = getWeaningBlockers({
      tipo_productivo_nombre: cria.tipo_productivo_nombre,
      estado_vital:           cria.estado_vital,
      estado_vinculo_materno: cria.estado_vinculo_materno,
      madre_id:               cria.madre_id,
    })
    if (blockers.length > 0) {
      throw new Error(`Destete no permitido para ${criaId}: ${blockers.join('; ')}`)
    }
  }

  // 2. Persistir: el RPC gestiona todo en una única transacción atómica
  const supabase = await createServerClient()
  const { data, error } = await supabase.rpc('registrar_destete_lote', {
    p_cria_ids:      input.cria_ids,
    p_fecha:         input.fecha,
    p_observaciones: input.observaciones ?? undefined,
  })
  if (error) throw error

  return data as unknown as RegistrarDesteteLoteResult
}
