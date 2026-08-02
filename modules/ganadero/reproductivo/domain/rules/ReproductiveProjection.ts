import { addDays, differenceInDays, parseISO } from 'date-fns'
import { validarTransicionReproductiva } from '../rules'
import type { ReproductiveContext, ReproductiveSnapshot } from '../types'
import type { UUID } from '../../../../shared/types'

// Días de gestación por especie (media biológica).
// Ver: documentacion/memory/decisions.md § fecha_prevista_parto y dias_restantes
const DIAS_GESTACION: Record<'vacuno' | 'porcino', number> = {
  vacuno:  283,   // rango realista: 270-290
  porcino: 114,   // regla 3-3-3: 3 meses, 3 semanas, 3 días
}

// Construye el snapshot observable del animal tras aplicar el evento reproductivo.
//
// cicloActivoId: resuelto por el Use Case antes de llamar a esta función.
//   Si la decisión fue 'reutilizar' → id del ciclo existente.
//   Si la decisión fue 'crear'      → null (el id real lo asigna el RPC dentro de su transacción).
//
// Precondición: checkEligibility(ctx) debe haber devuelto eligible=true antes de llamar aquí.
// validarTransicionReproductiva lanzará si el estado es incoherente (nunca debería ocurrir).
//
// Cálculo de fecha_prevista_parto:
//   CUBRICION                          → fecha_cubricion + dias_gestacion
//   CONFIRMACION_GESTACION desde vacia → fecha_confirmacion + (dias_gestacion - meses * 30)
//     El ganadero indica cuántos meses lleva la gestación; se descuenta de la duración total
//     para estimar cuántos días quedan hasta el parto. Es una aproximación (30 días/mes).
//   Todo lo demás                      → null (la fecha ya estaba calculada o no aplica)
export function buildSnapshot(
  ctx: ReproductiveContext,
  cicloActivoId: UUID | null,
): ReproductiveSnapshot {
  // Precondición garantizada por checkEligibility: si llegamos aquí, es_reproductora = true
  // y estado_reproductivo nunca puede ser null (null = módulo no aplica).
  const estadoActual = ctx.animal.estado_reproductivo!
  const estadoReproductivo = validarTransicionReproductiva(ctx.eventoSolicitado, estadoActual)

  const diasGestacion = DIAS_GESTACION[ctx.animal.especie]

  let fechaPrevistaParto: string | null = null

  if (ctx.eventoSolicitado === 'CUBRICION') {
    fechaPrevistaParto = addDays(parseISO(ctx.fechaEvento), diasGestacion)
      .toISOString()
      .split('T')[0]
  } else if (
    ctx.eventoSolicitado === 'CONFIRMACION_GESTACION' &&
    ctx.mesesGestacionEstimados !== undefined
  ) {
    // Días restantes estimados = duración total − meses ya transcurridos (aprox 30 días/mes)
    const diasRestantesEstimados = diasGestacion - ctx.mesesGestacionEstimados * 30
    fechaPrevistaParto = addDays(parseISO(ctx.fechaEvento), diasRestantesEstimados)
      .toISOString()
      .split('T')[0]
  }

  const diasRestantes =
    fechaPrevistaParto !== null
      ? differenceInDays(parseISO(fechaPrevistaParto), new Date())
      : null

  return {
    estadoReproductivo,
    cicloActivoId,
    fechaPrevistaParto,
    diasRestantes,
  }
}
