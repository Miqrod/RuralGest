import type { EstadoVital, EstadoReproductivo } from '@/modules/ganadero/shared/domain/types'

// Proyección contextual del dominio: traduce el estado observable de un animal
// en el conjunto de acciones que la UI debe ofrecer al usuario.
//
// Esta función es la única fuente de verdad sobre qué botones aparecen en SeccionAcciones.
// Reglas de disponibilidad:
//
//   salida        → siempre disponible para animales vivos
//   cubricion     → ciclo abierto + animal en vacía o cubierta (permite re-cubrición)
//   confirmacion  → ciclo abierto + animal en cubierta o vacía (PRD008: confirmación directa)
//   parto         → ciclo abierto + animal en cubierta o gestante
//   destete       → tiene crías elegibles con vínculo activo (independiente de es_reproductora)

export type AccionDisponible = 'salida' | 'cubricion' | 'confirmacion' | 'parto' | 'destete'

export interface AvailableActionsInput {
  estadoVital:         EstadoVital
  estadoReproductivo:  EstadoReproductivo | null
  tieneCicloAbierto:   boolean
  esReproductora:      boolean
  tieneCriasElegibles: boolean
}

export function getAvailableActions(input: AvailableActionsInput): Set<AccionDisponible> {
  const { estadoVital, estadoReproductivo, tieneCicloAbierto, esReproductora, tieneCriasElegibles } = input
  const acciones = new Set<AccionDisponible>()

  if (estadoVital !== 'vivo') return acciones

  acciones.add('salida')

  if (tieneCicloAbierto && (estadoReproductivo === 'vacia' || estadoReproductivo === 'cubierta')) {
    acciones.add('cubricion')
  }
  if (tieneCicloAbierto && (estadoReproductivo === 'cubierta' || estadoReproductivo === 'vacia')) {
    acciones.add('confirmacion')
  }
  if (tieneCicloAbierto && (estadoReproductivo === 'cubierta' || estadoReproductivo === 'gestante')) {
    acciones.add('parto')
  }
  if (tieneCriasElegibles) {
    acciones.add('destete')
  }

  return acciones
}
