import { fetchParametrizaciones } from '../../infrastructure/repository'
import type { Parametrizacion } from '../../domain/types'

export async function getParametrizaciones(): Promise<Parametrizacion[]> {
  return fetchParametrizaciones()
}
