import type { EstadoReproductivo } from '../../shared/domain/types'
import type { CodigoEventoReproductivo } from './types'

// ─── Distinción crítica de dominio ──────────────────────────────────────────
//
//   estado_reproductivo = NULL
//     → El módulo reproductivo NO aplica a este animal.
//     → Ocurre cuando es_reproductora = false (machos, engorde, recría,
//       cualquier tipo_productivo fuera del módulo reproductivo).
//     → Regla: es_reproductora = false ↔ estado_reproductivo = NULL
//
//   estado_reproductivo = 'vacia'
//     → El módulo reproductivo SÍ aplica y no hay gestación en curso.
//     → Estado basal: se asigna al convertir un animal a tipo_productivo REPRODUCTORA.
//
//   Son conceptos completamente distintos. NULL nunca es un alias de 'vacia'.
//
// ─── Reglas de transición ───────────────────────────────────────────────────
// Invariante: es_reproductora = true para todos los eventos reproductivos.
//
// CUBRICION admite repetición desde 'cubierta' (varias cubriciones en el mismo
// ciclo). La proyección usa siempre la última cubrición registrada.
// PARTO y ABORTO se permiten desde 'cubierta' o 'gestante': no es obligatorio
// confirmar gestación para llegar al parto.

const TRANSICIONES: Record<CodigoEventoReproductivo, { desde: EstadoReproductivo[]; hasta: EstadoReproductivo }> = {
  CUBRICION:              { desde: ['vacia', 'cubierta'],          hasta: 'cubierta'  },
  CONFIRMACION_GESTACION: { desde: ['cubierta'],                   hasta: 'gestante'  },
  PARTO:                  { desde: ['cubierta', 'gestante'],       hasta: 'lactante'  },
  DESTETE:                { desde: ['lactante'],                   hasta: 'vacia'     },
  ABORTO:                 { desde: ['cubierta', 'gestante'],       hasta: 'vacia'     },
}

export function validarTransicionReproductiva(
  codigoEvento: CodigoEventoReproductivo,
  estadoActual: EstadoReproductivo,
): EstadoReproductivo {
  const transicion = TRANSICIONES[codigoEvento]
  if (!transicion) return estadoActual
  if (!transicion.desde.includes(estadoActual)) {
    throw new Error(`Transición inválida: ${codigoEvento} desde estado '${estadoActual}'`)
  }
  return transicion.hasta
}

// Versión booleana para EligibilityRules: no lanza, solo informa.
// null significa que el módulo reproductivo no aplica → ningún evento está permitido.
export function estadoPermiteEvento(
  estadoActual: EstadoReproductivo | null,
  codigoEvento: CodigoEventoReproductivo,
): boolean {
  if (estadoActual === null) return false
  return TRANSICIONES[codigoEvento].desde.includes(estadoActual)
}
