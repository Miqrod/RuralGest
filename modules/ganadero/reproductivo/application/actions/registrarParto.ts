import { getAnimalById } from '../../../animales/infrastructure/repository'
import { getCicloAbierto, getPadreIdFromCiclo } from '../../infrastructure/repository'
import { checkEligibility } from '../../domain/rules/ReproductiveEligibilityRules'
import { evalCycleRules } from '../../domain/rules/ReproductiveCycleRules'
import { createServerClient } from '../../../../shared/db'
import type { RegistrarPartoInput, RegistrarPartoResult, ReproductiveContext } from '../../domain/types'
import type { UUID } from '../../../../shared/types'

// Calcula la raza de las crías a partir de las razas de madre y padre.
//   misma raza en ambos → esa raza
//   razas distintas     → 'Cruzada' (cruzadaRazaId, resuelto desde BD por el caller)
//   algún progenitor sin raza → null (se asignará durante la identificación)
function calcularRazaCria(
  madreRazaId: UUID | null,
  padreRazaId: UUID | null,
  cruzadaRazaId: UUID | null,
): UUID | null {
  if (!madreRazaId || !padreRazaId) return null
  if (madreRazaId === padreRazaId) return madreRazaId
  return cruzadaRazaId
}

// Registra un parto siguiendo el pipeline CRP:
//   Contexto → EligibilityRules → CycleRules → Projection → RPC transaccional
//
// El Parto actualiza el estado de la madre, crea la entrada en evento_parto y genera
// automáticamente un animal por cada cría viva, todo dentro de una única transacción.
//
// El ciclo reproductivo permanece ABIERTO — solo se cierra en el Destete.
//
// Inferencia de padre: getPadreIdFromCiclo busca primero en el evento CUBRICION
// (metadata_json.macho_id) y, como fallback, en CONFIRMACION_GESTACION
// (metadata_json.padre_id). Ver decisions.md § "Inferencia del padre en el parto".
export async function registrarParto(input: RegistrarPartoInput): Promise<RegistrarPartoResult> {
  // 1. Cargar datos necesarios para el contexto
  const madre = await getAnimalById(input.animal_id)
  if (!madre) throw new Error(`Animal no encontrado: ${input.animal_id}`)

  const cicloAbierto = await getCicloAbierto(input.animal_id)

  // 2. Construir contexto (data bag, sin lógica)
  const ctx: ReproductiveContext = {
    animal: {
      id:                  madre.id,
      especie:             madre.especie,
      es_reproductora:     madre.es_reproductora,
      estado_reproductivo: madre.estado_reproductivo,
    },
    cicloAbierto,
    eventoSolicitado: 'PARTO',
    fechaEvento:       input.fecha_parto,
  }

  // 3. Elegibilidad: es_reproductora = true y estado_reproductivo ∈ {cubierta, gestante}
  const eligibility = checkEligibility(ctx)
  if (!eligibility.eligible) {
    throw new Error(`Parto no permitido: ${eligibility.errors.join('; ')}`)
  }

  // 4. Decisión de ciclo: siempre reutilizar — el ciclo debe existir previamente.
  // evalCycleRules lanza si no hay ciclo abierto.
  const decision = evalCycleRules(ctx)

  // 5. Inferencia de padre y raza de las crías
  // El RPC gestiona internamente el estado reproductivo resultante y el nuevo ciclo VACÍA.
  const supabase = await createServerClient()
  const machoId = await getPadreIdFromCiclo(decision.cicloId)

  // Buscamos 'Cruzada' por nombre — única clave estable disponible en el esquema actual
  const { data: razaCruzadaRow } = await supabase
    .from('raza')
    .select('id')
    .eq('nombre', 'Cruzada')
    .maybeSingle()
  const cruzadaRazaId: UUID | null = razaCruzadaRow?.id ?? null

  let razaCriaId: UUID | null = null
  if (machoId) {
    const padre = await getAnimalById(machoId)
    razaCriaId = calcularRazaCria(madre.raza_id, padre?.raza_id ?? null, cruzadaRazaId)
  }

  // 6. Persistir: RPC gestiona evento + evento_parto + snapshot madre + crías en una transacción
  const { data, error } = await supabase.rpc('registrar_parto', {
    p_animal_id:      input.animal_id,
    p_fecha:          input.fecha_parto,
    p_ciclo_id:       decision.cicloId,
    p_numero_nacidos: input.numero_nacidos,
    p_numero_vivos:   input.numero_vivos,
    p_numero_muertos: input.numero_muertos,
    p_tipo_parto:     input.tipo_parto,
    p_padre_id:       machoId    ?? undefined,
    p_raza_cria_id:   razaCriaId ?? undefined,
    p_observaciones:  input.observaciones ?? undefined,
  })
  if (error) throw error

  // El RPC devuelve JSONB, que Supabase tipifica como Json (unión amplia).
  // Pasamos por unknown porque sabemos la forma exacta del objeto en runtime
  // pero TypeScript no puede verificarlo sin un JSON schema o validador externo.
  return data as unknown as RegistrarPartoResult
}
