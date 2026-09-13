import type { InstalacionDestino } from '../../domain/types'
import { fetchDestinosReubicacion } from '../../infrastructure/repository'

// Instalaciones elegibles como destino: activo=true AND admite_animales=true.
// El RPC vuelve a validar estas condiciones dentro de la transacción.
export async function listarDestinosReubicacion(): Promise<InstalacionDestino[]> {
  return fetchDestinosReubicacion()
}
