import { insertCiclo, updateCicloCierre } from '../infrastructure/repository'
import type { UUID } from '../../../shared/types'
import type { CicloReproductivo } from '../domain/types'
import type { ResultadoCiclo } from '../../shared/domain/types'

// Crea un nuevo ciclo reproductivo para el animal.
//
// Llamar SOLO cuando ReproductiveCycleRules determine que no hay ciclo abierto.
// La decisión "crear vs. reutilizar" pertenece a ReproductiveCycleRules (tarea #75),
// que opera sobre el ReproductiveContext que el Use Case construye previamente.
// Es válido tener varias cubriciones dentro de un mismo ciclo (fallos, repeticiones).
//
// Elegibilidad (es_reproductora, sexo = hembra) → validada en ReproductiveEligibilityRules.
export async function abrirCiclo(animalId: UUID, fechaInicio: string): Promise<CicloReproductivo> {
  return insertCiclo({
    animal_id:  animalId,
    fecha_inicio: fechaInicio,
    fecha_fin:  null,
    resultado:  null,
    created_by: null,
  })
}

// Cierra el ciclo con su resultado definitivo.
//
// Regla de cuándo cierra cada evento y si se abre uno nuevo (lo coordina el Use Case):
//   aborto  → cierra (resultado='aborto')  + abrir nuevo inmediatamente (estado VACÍA)
//   destete → cierra (resultado='parto')   + abrir nuevo (estado VACÍA)
//   venta   → cierra (resultado='venta')   + NO abrir nuevo
//   muerte  → cierra (resultado='muerte')  + NO abrir nuevo
//   timeout → cierra (resultado='desconocido') + NO abrir nuevo
//
// Nota: PARTO no cierra el ciclo. Es un hito interno; el ciclo sigue abierto hasta el destete.
export async function cerrarCiclo(
  cicloId: UUID,
  resultado: ResultadoCiclo,
  fechaFin: string,
): Promise<CicloReproductivo> {
  return updateCicloCierre(cicloId, resultado, fechaFin)
}
