import type { ReproductiveContext, ReproductiveCycleDecision } from '../types'

// Responde a: ¿qué debe pasar con el ciclo cuando llega este evento?
// Opera exclusivamente sobre el contexto (datos ya cargados por el Use Case).
// No accede a la DB, no crea ni cierra ciclos — eso lo hace el Use Case.
//
// CUBRICION:
//   ciclo abierto existente → reutilizar (repetición en el mismo ciclo)
//   sin ciclo abierto       → crear      (primera cubrición o tras timeout/desconocido)
//
// CONFIRMACION_GESTACION:
//   ciclo abierto existente → reutilizar (vino de cubrición previa)
//   sin ciclo abierto       → crear      (PRD008: confirmación es el primer hecho del ciclo)
//
// PARTO, DESTETE, ABORTO: se implementarán cuando existan sus Use Cases.
export function evalCycleRules(ctx: ReproductiveContext): ReproductiveCycleDecision {
  switch (ctx.eventoSolicitado) {
    case 'CUBRICION':
      return ctx.cicloAbierto !== null
        ? { accion: 'reutilizar', cicloId: ctx.cicloAbierto.id }
        : { accion: 'crear',      cicloId: null }

    case 'CONFIRMACION_GESTACION':
      return ctx.cicloAbierto !== null
        ? { accion: 'reutilizar', cicloId: ctx.cicloAbierto.id }
        : { accion: 'crear',      cicloId: null }

    case 'PARTO':
      // El Parto no crea ni cierra el ciclo — solo puede ocurrir con uno abierto.
      // EligibilityRules garantiza que el estado es cubierta/gestante, lo que implica ciclo abierto.
      if (ctx.cicloAbierto === null) {
        throw new Error('PARTO requiere un ciclo reproductivo abierto')
      }
      return { accion: 'reutilizar', cicloId: ctx.cicloAbierto.id }

    default:
      throw new Error(
        `ReproductiveCycleRules: evento '${ctx.eventoSolicitado}' no implementado aún`,
      )
  }
}

// El ciclo debe cerrarse cuando no quedan crías con vínculo materno activo.
// El caller (Use Case de destete) obtiene el count del repositorio y pasa aquí el resultado.
export function shouldCloseCycle(activeBondsCount: number): boolean {
  return activeBondsCount === 0
}
