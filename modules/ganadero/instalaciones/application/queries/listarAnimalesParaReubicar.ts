import type { AnimalParaReubicar } from '../../domain/types'
import { fetchAnimalesParaReubicar } from '../../infrastructure/repository'

// Todos los animales vivos disponibles para la pantalla global de reubicación.
// Incluye ubicación actual y fecha del último CAMBIO_UBICACION para el datepicker.
export async function listarAnimalesParaReubicar(): Promise<AnimalParaReubicar[]> {
  return fetchAnimalesParaReubicar()
}
