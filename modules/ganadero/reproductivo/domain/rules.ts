import type { EstadoReproductivo } from '../../shared/domain/types'

const TRANSICIONES: Record<string, { desde: EstadoReproductivo[]; hasta: EstadoReproductivo }> = {
  CUBRICION: { desde: ['vacia', 'no_reproductiva'], hasta: 'gestante' },
  PARTO:     { desde: ['gestante'],                  hasta: 'lactante' },
  DESTETE:   { desde: ['lactante'],                  hasta: 'vacia'    },
  ABORTO:    { desde: ['gestante'],                  hasta: 'vacia'    },
}

export function validarTransicionReproductiva(
  codigoEvento: string,
  estadoActual: EstadoReproductivo,
): EstadoReproductivo {
  const transicion = TRANSICIONES[codigoEvento]
  if (!transicion) return estadoActual
  if (!transicion.desde.includes(estadoActual)) {
    throw new Error(`Transición inválida: ${codigoEvento} desde estado '${estadoActual}'`)
  }
  return transicion.hasta
}
