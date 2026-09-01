import { getAnimalById } from '../../../animales/infrastructure/repository'
import { getCicloAbierto } from '../../infrastructure/repository'
import { checkEligibility } from '../../domain/rules/ReproductiveEligibilityRules'
import { createServerClient } from '../../../../shared/db'
import type { RegistrarMachorraInput, RegistrarMachorraResult, ReproductiveContext } from '../../domain/types'

// Registra una oportunidad reproductiva sin resultado (machorra) siguiendo el pipeline CRP:
//   Contexto → EligibilityRules → RPC transaccional
//
// A diferencia de Aborto, Machorra:
//   · solo es válida si es_reproductora = true (no existe el caso de completar
//     una historia iniciada para un animal que ha dejado de ser reproductora)
//   · no acepta fecha: la genera el RPC con CURRENT_DATE para evitar ambigüedad
//     sobre cuándo se "toma la decisión" (OBJ-02 PRD012)
//
// Consecuencias atómicas en el RPC:
//   · Crea evento MACHORRA ligado al ciclo activo más reciente
//   · Cierra ese ciclo (resultado = 'machorra')
//   · Si es_reproductora = true → abre nuevo ciclo en 'vacia'
//   · No modifica vínculos madre-cría (OBJ-01)
export async function registrarMachorra(input: RegistrarMachorraInput): Promise<RegistrarMachorraResult> {
  const animal = await getAnimalById(input.animal_id)
  if (!animal) throw new Error(`Animal no encontrado: ${input.animal_id}`)

  // Machorra requiere reproductora activa — no permite completar historia iniciada
  // en un animal que ya no es reproductora (a diferencia de Parto/Aborto).
  if (!animal.es_reproductora) {
    throw new Error('Machorra no permitida: el animal no es reproductora')
  }

  const cicloAbierto = await getCicloAbierto(input.animal_id)

  // La fecha del evento es la del día de ejecución; el RPC la genera internamente
  // con CURRENT_DATE. Se pasa aquí solo para que EligibilityRules pueda evaluar
  // el contexto temporal si fuera necesario en el futuro.
  const fechaHoy = new Date().toISOString().split('T')[0] as `${number}-${number}-${number}`

  const ctx: ReproductiveContext = {
    animal: {
      id:                  animal.id,
      especie:             animal.especie,
      es_reproductora:     animal.es_reproductora,
      estado_reproductivo: animal.estado_reproductivo,
    },
    cicloAbierto,
    eventoSolicitado: 'MACHORRA',
    fechaEvento:       fechaHoy,
  }

  const eligibility = checkEligibility(ctx)
  if (!eligibility.eligible) {
    throw new Error(`Machorra no permitida: ${eligibility.errors.join('; ')}`)
  }

  const supabase = await createServerClient()
  const { data, error } = await supabase.rpc('registrar_machorra', {
    p_animal_id: input.animal_id,
  })
  if (error) throw error

  return data as unknown as RegistrarMachorraResult
}
