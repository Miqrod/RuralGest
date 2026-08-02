import { getAnimalById } from '../../../animales/infrastructure/repository'
import { getCicloAbierto } from '../../infrastructure/repository'
import { checkEligibility } from '../../domain/rules/ReproductiveEligibilityRules'
import { evalCycleRules } from '../../domain/rules/ReproductiveCycleRules'
import { buildSnapshot } from '../../domain/rules/ReproductiveProjection'
import { createServerClient } from '../../../../shared/db'
import type { RegistrarConfirmacionGestacionInput, ReproductiveContext } from '../../domain/types'
import type { UUID } from '../../../../shared/types'

// Registra la confirmación de gestación siguiendo el pipeline CRP completo:
//   Contexto → EligibilityRules → CycleRules → Projection → RPC transaccional
//
// Soporta dos recorridos (PRD008):
//
//   Desde 'cubierta' (cubrición previa registrada):
//     - CycleRules → reutilizar ciclo existente
//     - Projection no calcula fecha_prevista_parto (ya está establecida desde la cubrición)
//     - RPC recibe p_ciclo_id + p_fecha_prevista_parto = null
//
//   Desde 'vacia' (confirmación es el primer hecho conocido del ciclo):
//     - CycleRules → crear nuevo ciclo
//     - Projection calcula fecha_prevista_parto a partir de meses_gestacion_estimados
//     - RPC recibe p_ciclo_id = null (lo crea internamente) + p_fecha_prevista_parto calculada
//
// meses_gestacion_estimados es un dato auxiliar efímero: nunca se persiste.
export async function confirmarGestacion(
  input: RegistrarConfirmacionGestacionInput,
): Promise<UUID> {
  // 1. Cargar datos necesarios para el contexto
  const animal = await getAnimalById(input.animal_id)
  if (!animal) throw new Error(`Animal no encontrado: ${input.animal_id}`)

  const cicloAbierto = await getCicloAbierto(input.animal_id)

  // 2. Construir contexto (data bag, sin lógica)
  const ctx: ReproductiveContext = {
    animal: {
      id:                  animal.id,
      especie:             animal.especie,
      es_reproductora:     animal.es_reproductora,
      estado_reproductivo: animal.estado_reproductivo,
    },
    cicloAbierto,
    eventoSolicitado:        'CONFIRMACION_GESTACION',
    fechaEvento:             input.fecha_confirmacion,
    mesesGestacionEstimados: input.meses_gestacion_estimados,
  }

  // 3. Elegibilidad: es_reproductora = true y estado_reproductivo ∈ {cubierta, vacia}
  const eligibility = checkEligibility(ctx)
  if (!eligibility.eligible) {
    throw new Error(`Confirmación no permitida: ${eligibility.errors.join('; ')}`)
  }

  // 4. Decisión de ciclo: reutilizar el existente (desde cubierta) o crear uno nuevo (desde vacia)
  const decision = evalCycleRules(ctx)

  // 5. Proyección: calcula fecha_prevista_parto solo cuando se crea ciclo nuevo (desde vacia)
  const snapshot = buildSnapshot(ctx, decision.cicloId)

  // 6. Persistir: RPC maneja evento + ciclo (si procede) + snapshot en una sola transacción
  const supabase = await createServerClient()
  const { data: eventoId, error } = await supabase.rpc('registrar_confirmacion_gestacion', {
    p_animal_id:            input.animal_id,
    p_fecha:                input.fecha_confirmacion,
    p_ciclo_id:             decision.cicloId     ?? undefined,  // null → RPC crea el ciclo
    p_fecha_prevista_parto: snapshot.fechaPrevistaParto ?? undefined,
    p_observaciones:        input.observaciones  ?? undefined,
  })
  if (error) throw error

  return eventoId as UUID
}
