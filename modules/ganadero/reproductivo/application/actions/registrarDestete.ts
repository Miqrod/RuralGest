import { getAnimalById } from '../../../animales/infrastructure/repository'
import { canWean, getWeaningBlockers } from '../../domain/rules/ReproductiveEligibilityRules'
import { createServerClient } from '../../../../shared/db'
import type { RegistrarDesteteInput, RegistrarDesteteResult } from '../../domain/types'

// Registra el destete de una cría siguiendo el pipeline CRP:
//
//   Contexto  → carga la cría desde la DB
//   Reglas    → canWean / getWeaningBlockers (validación TypeScript antes del RPC)
//   RPC       → registrar_destete realiza la transacción atómica en Postgres
//
// La evaluación de cierre de ciclo ocurre dentro del RPC, no aquí.
// El caller recibe cicloCerrado=true cuando el ciclo quedó cerrado (última cría).
export async function registrarDestete(
  input: RegistrarDesteteInput,
): Promise<RegistrarDesteteResult> {
  // 1. Cargar la cría para aplicar reglas de dominio antes de ir a la DB
  const cria = await getAnimalById(input.cria_id)
  if (!cria) throw new Error(`Cría no encontrada: ${input.cria_id}`)

  // 2. Reglas de elegibilidad (pre-validación en TypeScript)
  const blockers = getWeaningBlockers({
    tipo_productivo_nombre: cria.tipo_productivo_nombre,
    estado_vital:           cria.estado_vital,
    estado_vinculo_materno: cria.estado_vinculo_materno,
    madre_id:               cria.madre_id,
  })
  if (blockers.length > 0) {
    throw new Error(`Destete no permitido: ${blockers.join('; ')}`)
  }

  // 3. Persistir: el RPC gestiona todo en una transacción atómica
  const supabase = await createServerClient()
  const { data, error } = await supabase.rpc('registrar_destete', {
    p_cria_id:       input.cria_id,
    p_fecha:         input.fecha,
    p_observaciones: input.observaciones ?? undefined,
  })
  if (error) throw error

  return data as unknown as RegistrarDesteteResult
}
