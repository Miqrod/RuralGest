import { insertCiclo, updateCicloCierre } from '../infrastructure/repository'
import type { UUID } from '../../../shared/types'
import type { CicloReproductivo } from '../domain/types'
import type { ResultadoCiclo } from '../../shared/domain/types'

// Crea un nuevo ciclo reproductivo en estado VACÍA para el animal.
//
// Cuándo se llama:
//   - Al convertirse el animal en REPRODUCTORA (primer ciclo)
//   - Tras un desenlace (Parto, Aborto, Machorra) si sigue siendo reproductora
//
// Los RPCs de Parto/Aborto crean el nuevo ciclo internamente (atomicidad).
// Esta función se usará principalmente en el flujo de cambio de tipo productivo (T152).
export async function abrirCiclo(animalId: UUID, fechaInicio: string): Promise<CicloReproductivo> {
  return insertCiclo({
    animal_id:  animalId,
    fecha_inicio: fechaInicio,
    fecha_fin:  null,
    resultado:  null,
    created_by: null,
  })
}

// Informa la fecha_fin del ciclo cuando ya no quedan eventos pendientes.
//
// Distinción importante:
//   resultado  → desenlace reproductivo (parto, aborto, machorra, cierre_manual)
//   fecha_fin  → finalización histórica (cuando ya no pueden llegar más eventos al ciclo)
//
// Tras un Parto: resultado='parto', fecha_fin=NULL mientras existan vínculos madre-cría.
//   El Destete del último vínculo activa fecha_fin en el ciclo del Parto.
// Tras un Aborto/Machorra/Cierre manual: resultado y fecha_fin coinciden en la misma fecha.
//
// shouldCreateNewCycleAfterDesenlace determina si se abre un nuevo ciclo en 'vacia'.
export async function cerrarCiclo(
  cicloId: UUID,
  resultado: ResultadoCiclo,
  fechaFin: string,
): Promise<CicloReproductivo> {
  return updateCicloCierre(cicloId, resultado, fechaFin)
}
