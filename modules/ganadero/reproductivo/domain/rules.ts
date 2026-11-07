import type { EstadoReproductivo, EstadoVital, ResultadoCiclo } from '../../shared/domain/types'
import type { CodigoEventoReproductivo } from './types'

// ─── Distinción crítica de dominio ──────────────────────────────────────────
//
//   estado_reproductivo = NULL
//     → El módulo reproductivo NO aplica a este animal.
//     → Ocurre cuando es_reproductora = false (machos, engorde, recría,
//       cualquier tipo_productivo fuera del módulo reproductivo).
//     → Regla: es_reproductora = false ↔ estado_reproductivo = NULL
//     → NULL nunca es alias de 'vacia': son conceptos distintos.
//
//   estado_reproductivo = 'vacia'
//     → Módulo reproductivo aplica, no hay gestación en curso.
//     → Estado basal cuando el animal se convierte en REPRODUCTORA o tras un desenlace.
//
// ─── Separación historia reproductiva / maternidad ──────────────────────────
//
//   El PARTO fija el resultado del ciclo (resultado='parto') pero NO lo bloquea:
//   el ciclo puede seguir recibiendo eventos que históricamente le pertenecen
//   (p.ej. destetes de las crías nacidas). 'fecha_fin' se informa solo cuando
//   ya no quedan eventos pendientes para ese ciclo.
//   En paralelo, si la madre sigue siendo reproductora, el Parto permite abrir
//   un nuevo ciclo_id con estado 'vacia'. Ambas historias coexisten.
//
//   El DESTETE finaliza vínculos madre-cría, no transiciona el estado reproductivo.
//   Por eso DESTETE no aparece en TRANSICIONES.
//
// ─── Reglas de transición ───────────────────────────────────────────────────
// CUBRICION admite repetición desde 'cubierta' (varias cubriciones en el mismo ciclo).
// PARTO y ABORTO se permiten desde 'cubierta' o 'gestante': no es obligatorio
// confirmar gestación para llegar al parto.
// El ciclo debe existir previamente (creado al convertirse en REPRODUCTORA o
// tras un desenlace). Ni CUBRICION ni CONFIRMACION crean ciclos.

const TRANSICIONES: Record<Exclude<CodigoEventoReproductivo, 'DESTETE'>, { desde: EstadoReproductivo[]; hasta: EstadoReproductivo }> = {
  CUBRICION:              { desde: ['vacia', 'cubierta'],    hasta: 'cubierta' },
  CONFIRMACION_GESTACION: { desde: ['cubierta', 'vacia'],    hasta: 'gestante' },
  // El Parto fija resultado='parto' en el ciclo actual y, si la madre sigue siendo
  // reproductora, abre un nuevo ciclo VACÍA. El 'hasta' refleja el estado del animal
  // tras el parto: el nuevo ciclo arranca en 'vacia'.
  PARTO:                  { desde: ['cubierta', 'gestante'], hasta: 'vacia'    },
  ABORTO:                 { desde: ['cubierta', 'gestante'], hasta: 'vacia'    },
  // Machorra: la oportunidad reproductiva termina sin resultado. Solo válido desde
  // VACÍA o CUBIERTA — si la gestación ya fue confirmada (GESTANTE) el veterinario
  // debe registrar un ABORTO en su lugar.
  MACHORRA:               { desde: ['vacia', 'cubierta'],    hasta: 'vacia'    },
}

export function validarTransicionReproductiva(
  codigoEvento: CodigoEventoReproductivo,
  estadoActual: EstadoReproductivo,
): EstadoReproductivo {
  // DESTETE no transiciona el estado reproductivo: finaliza vínculos madre-cría.
  if (codigoEvento === 'DESTETE') return estadoActual
  const transicion = TRANSICIONES[codigoEvento]
  if (!transicion.desde.includes(estadoActual)) {
    throw new Error(`Transición inválida: ${codigoEvento} desde estado '${estadoActual}'`)
  }
  return transicion.hasta
}

// Versión booleana para EligibilityRules: no lanza, solo informa.
// null significa que el módulo reproductivo no aplica → ningún evento está permitido.
// DESTETE se valida por separado (canWean/getWeaningBlockers), no por estado reproductivo.
export function estadoPermiteEvento(
  estadoActual: EstadoReproductivo | null,
  codigoEvento: Exclude<CodigoEventoReproductivo, 'DESTETE'>,
): boolean {
  if (estadoActual === null) return false
  return TRANSICIONES[codigoEvento].desde.includes(estadoActual)
}

// ─── Entradas sintéticas de cierre en el carrusel ─────────────────────────────
//
// Decide qué entrada de presentación (nunca persistida) añade el carrusel al
// final de un ciclo cerrado sin evento propio que explique el cierre:
//
//   'salida'        → ciclo cerrado por venta/muerte: fecha_fin con resultado NULL
//                     (convención de registrar_salida_animal) y animal no vivo.
//   'cierre_manual' → ciclo cerrado por cambio de tipo productivo ANTES de que
//                     existiera el evento CAMBIO_TIPO_PRODUCTIVO (compatibilidad).
//                     Los ciclos nuevos ya traen el evento real y no la necesitan.
//   null            → el ciclo no necesita entrada sintética.
//
// Tipo estructural (no CicloHistorial) para no acoplar el dominio a la capa de queries.
export function tipoEntradaSinteticaCierre(
  ciclo: {
    fecha_fin: string | null
    resultado: ResultadoCiclo | null
    eventos:   { codigo: string }[]
  },
  estadoVital: EstadoVital,
): 'salida' | 'cierre_manual' | null {
  if (ciclo.fecha_fin && !ciclo.resultado && estadoVital !== 'vivo') return 'salida'

  const tieneEventoCambioTipo = ciclo.eventos.some(e => e.codigo === 'CAMBIO_TIPO_PRODUCTIVO')
  if (ciclo.resultado === 'cierre_manual' && ciclo.fecha_fin && !tieneEventoCambioTipo) return 'cierre_manual'

  return null
}
