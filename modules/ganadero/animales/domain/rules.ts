import type { Animal, CrearAnimalInput } from './types'

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

// Primera línea de defensa antes del RPC: valida contra el snapshot en memoria,
// sin roundtrip a BD. El RPC añade una segunda validación con FOR UPDATE dentro
// de la transacción para cubrir condiciones de carrera.
export function assertAnimalPuedeSalir(animal: Pick<Animal, 'estado_vital' | 'crotal'>) {
  if (animal.estado_vital !== 'vivo') {
    const identificador = animal.crotal ? ` (crotal: ${animal.crotal})` : ''
    throw new Error(
      `El animal${identificador} no puede salir: estado_vital actual es "${animal.estado_vital}"`,
    )
  }
}
