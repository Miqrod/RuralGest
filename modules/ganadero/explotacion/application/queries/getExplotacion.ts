import { fetchExplotacion } from '../../infrastructure/repository'
import type { Explotacion } from '../../domain/types'

export async function getExplotacion(): Promise<Explotacion | null> {
  return fetchExplotacion()
}
