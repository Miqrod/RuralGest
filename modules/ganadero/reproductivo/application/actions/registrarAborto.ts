import { getAnimalById } from '../../../animales/infrastructure/repository'
import { getCicloAbierto } from '../../infrastructure/repository'
import { checkEligibility } from '../../domain/rules/ReproductiveEligibilityRules'
import { createServerClient } from '../../../../shared/db'
import type { RegistrarAbortoInput, RegistrarAbortoResult, ReproductiveContext } from '../../domain/types'

// Registra una pérdida de gestación (aborto) siguiendo el pipeline CRP:
//   Contexto → EligibilityRules → RPC transaccional
//
// No se invoca CycleRules ni Projection porque el RPC resuelve el ciclo
// internamente (ORDER BY numero_ciclo DESC LIMIT 1) y no necesita cicloId
// como parámetro — a diferencia de cubricion/parto/confirmacion.
//
// Consecuencias atómicas en el RPC:
//   · Crea evento ABORTO ligado al ciclo activo más reciente
//   · Cierra ese ciclo (resultado = 'aborto')
//   · Si es_reproductora = true → abre nuevo ciclo en 'vacia'
//   · Si es_reproductora = false → estado_reproductivo = NULL (rama defensiva)
export async function registrarAborto(input: RegistrarAbortoInput): Promise<RegistrarAbortoResult> {
  const animal = await getAnimalById(input.animal_id)
  if (!animal) throw new Error(`Animal no encontrado: ${input.animal_id}`)

  const cicloAbierto = await getCicloAbierto(input.animal_id)

  const ctx: ReproductiveContext = {
    animal: {
      id:                  animal.id,
      especie:             animal.especie,
      es_reproductora:     animal.es_reproductora,
      estado_reproductivo: animal.estado_reproductivo,
    },
    cicloAbierto,
    eventoSolicitado: 'ABORTO',
    fechaEvento:       input.fecha_aborto,
  }

  const eligibility = checkEligibility(ctx)
  if (!eligibility.eligible) {
    throw new Error(`Aborto no permitido: ${eligibility.errors.join('; ')}`)
  }

  const supabase = await createServerClient()
  const { data, error } = await supabase.rpc('registrar_aborto', {
    p_animal_id:     input.animal_id,
    p_fecha:         input.fecha_aborto,
    p_observaciones: input.observaciones ?? undefined,
  })
  if (error) throw error

  return data as unknown as RegistrarAbortoResult
}
