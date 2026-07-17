import { getAnimalById } from '../../../animales/infrastructure/repository'
import { getCicloAbierto } from '../../infrastructure/repository'
import { checkEligibility } from '../../domain/rules/ReproductiveEligibilityRules'
import { evalCycleRules } from '../../domain/rules/ReproductiveCycleRules'
import { buildSnapshot } from '../../domain/rules/ReproductiveProjection'
import { createServerClient } from '../../../../shared/db'
import type { RegistrarCubricionInput, ReproductiveContext } from '../../domain/types'
import type { UUID } from '../../../../shared/types'

// Registra una cubrición siguiendo el pipeline CRP:
//   Contexto → EligibilityRules → CycleRules → Projection → RPC transaccional
//
// El ciclo reproductivo se crea o reutiliza dentro del RPC (una sola transacción).
// No se llama a abrirCiclo() desde aquí: evita el gap de atomicidad entre
// la inserción del ciclo y la del evento.
export async function registrarCubricion(input: RegistrarCubricionInput): Promise<UUID> {
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
    eventoSolicitado: 'CUBRICION',
    fechaEvento:       input.fecha_cubricion,
  }

  // 3. Elegibilidad: ¿puede este animal recibir una cubrición?
  const eligibility = checkEligibility(ctx)
  if (!eligibility.eligible) {
    throw new Error(`Cubrición no permitida: ${eligibility.errors.join('; ')}`)
  }

  // 4. Decisión de ciclo: crear nuevo o reutilizar el abierto
  const decision = evalCycleRules(ctx)

  // 5. Proyección: estado resultante y fecha prevista de parto
  // cicloActivoId es null cuando se va a crear (el RPC asigna el id real)
  const snapshot = buildSnapshot(ctx, decision.cicloId)

  // 6. Persistir: RPC maneja ciclo + evento + snapshot en una sola transacción
  const supabase = await createServerClient()
  const { data: eventoId, error } = await supabase.rpc('registrar_cubricion', {
    p_animal_id:             input.animal_id,
    p_fecha:                 input.fecha_cubricion,
    p_ciclo_id:              decision.cicloId     ?? undefined,  // null → RPC crea el ciclo
    p_estado_reproductivo:   snapshot.estadoReproductivo,
    p_fecha_prevista_parto:  snapshot.fechaPrevistaParto ?? undefined,
    p_tipo_cubricion:        input.tipo_cubricion,
    p_macho_id:              input.macho_id       ?? undefined,
    p_observaciones:         input.observaciones  ?? undefined,
  })
  if (error) throw error

  return eventoId as UUID
}
