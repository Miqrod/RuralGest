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
//   Si la decisión fue 'crear'      → id del ciclo recién insertado por abrirCiclo().
//
// Precondición: checkEligibility(ctx) debe haber devuelto eligible=true antes de llamar aquí.
// validarTransicionReproductiva lanzará si el estado es incoherente (nunca debería ocurrir).
// cicloActivoId es null cuando ReproductiveCycleRules decide 'crear':
// el id real lo asigna el RPC registrar_cubricion dentro de su transacción.
export function buildSnapshot(
  ctx: ReproductiveContext,
  cicloActivoId: UUID | null,
): ReproductiveSnapshot {
  // Precondición garantizada por checkEligibility: si llegamos aquí, es_reproductora = true
  // y estado_reproductivo nunca puede ser null (null = módulo no aplica).
  const estadoActual = ctx.animal.estado_reproductivo!
  const estadoReproductivo = validarTransicionReproductiva(ctx.eventoSolicitado, estadoActual)

  const fechaPrevistaParto =
    ctx.eventoSolicitado === 'CUBRICION'
      ? addDays(parseISO(ctx.fechaEvento), DIAS_GESTACION[ctx.animal.especie])
          .toISOString()
          .split('T')[0]
      : null

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
