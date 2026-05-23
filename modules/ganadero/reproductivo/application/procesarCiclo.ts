import type { UUID } from '../../../shared/types'
import type { CicloReproductivo } from '../domain/types'
import type { ResultadoCiclo } from '../../shared/domain/types'

export async function abrirCiclo(_animalId: UUID, _fechaInicio: string): Promise<CicloReproductivo> {
  // TODO: assert animal es reproductora
  // TODO: assert no existe ciclo abierto (sin fecha_fin) para este animal
  // TODO: insert ciclo_reproductivo con numero_ciclo = último + 1
  throw new Error('not implemented')
}

export async function cerrarCiclo(
  _cicloId: UUID,
  _resultado: ResultadoCiclo,
  _fechaFin: string,
): Promise<CicloReproductivo> {
  // TODO: assert ciclo existe y está abierto
  // TODO: update fecha_fin + resultado
  throw new Error('not implemented')
}
