import type { UUID } from '../../../../shared/types'
import { setInstalacionActivo, fetchAnimalesEnInstalacion } from '../../infrastructure/repository'

// La instalación no puede desactivarse si tiene animales asignados actualmente.
// La validación aquí es defensa en UI — el invariante también se impone en DB
// bloqueando CAMBIO_UBICACION hacia instalaciones inactivas.
export async function desactivarInstalacion(id: UUID): Promise<void> {
  const animales = await fetchAnimalesEnInstalacion(id)
  if (animales.length > 0) {
    throw new Error(
      `No se puede desactivar: hay ${animales.length} animal${animales.length > 1 ? 'es' : ''} en esta instalación. Reubícalos primero.`
    )
  }
  await setInstalacionActivo(id, false)
}
