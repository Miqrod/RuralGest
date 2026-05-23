import type { CrearAnimalInput } from './types'

export function assertFechaNacimientoPresente(
  input: Pick<CrearAnimalInput, 'fecha_nacimiento' | 'fecha_nacimiento_estimada'>,
) {
  if (!input.fecha_nacimiento && !input.fecha_nacimiento_estimada) {
    throw new Error('Se requiere fecha_nacimiento o fecha_nacimiento_estimada')
  }
}

export function assertEstadoReproductivoCoherente(
  es_reproductora: boolean,
  estado_reproductivo: string | null,
) {
  if (!es_reproductora && estado_reproductivo !== null) {
    throw new Error('Un animal no reproductor no puede tener estado_reproductivo')
  }
}
