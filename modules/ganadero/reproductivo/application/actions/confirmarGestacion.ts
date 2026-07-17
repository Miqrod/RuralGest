import { getAnimalById } from '../../../animales/infrastructure/repository'
import { getCicloAbierto } from '../../infrastructure/repository'
import { checkEligibility } from '../../domain/rules/ReproductiveEligibilityRules'
import { evalCycleRules } from '../../domain/rules/ReproductiveCycleRules'
import { createServerClient } from '../../../../shared/db'
import type { RegistrarConfirmacionGestacionInput, ReproductiveContext } from '../../domain/types'
import type { UUID } from '../../../../shared/types'

// Registra la confirmación de gestación siguiendo el pipeline CR (sin Projection):
//   Contexto → EligibilityRules → CycleRules → RPC transaccional
//
// No se llama a buildSnapshot porque el RPC hardcodea la transición cubierta → gestante
// internamente y no necesita fecha_prevista_parto (no cambia en la confirmación).
// La validación de la transición la garantiza checkEligibility mediante estadoPermiteEvento.
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
    eventoSolicitado: 'CONFIRMACION_GESTACION',
    fechaEvento:       input.fecha_confirmacion,
  }

  // 3. Elegibilidad: es_reproductora = true y estado_reproductivo = 'cubierta'
  const eligibility = checkEligibility(ctx)
  if (!eligibility.eligible) {
    throw new Error(`Confirmación no permitida: ${eligibility.errors.join('; ')}`)
  }

  // 4. Decisión de ciclo: siempre reutiliza el ciclo abierto (lanza si no existe)
  const decision = evalCycleRules(ctx)

  // 5. Persistir: RPC maneja evento + actualización de estado en una sola transacción
  const supabase = await createServerClient()
  const { data: eventoId, error } = await supabase.rpc('registrar_confirmacion_gestacion', {
    p_animal_id:     input.animal_id,
    p_fecha:         input.fecha_confirmacion,
    p_ciclo_id:      decision.cicloId!,
    p_observaciones: input.observaciones ?? undefined,
  })
  if (error) throw error

  return eventoId as UUID
}
