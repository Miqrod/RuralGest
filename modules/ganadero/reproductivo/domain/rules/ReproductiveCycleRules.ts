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
//   siempre reutiliza el ciclo abierto — confirmar sin cubrición previa es imposible.
//
// PARTO, DESTETE, ABORTO: se implementarán en PRD008+ cuando existan sus Use Cases.
export function evalCycleRules(ctx: ReproductiveContext): ReproductiveCycleDecision {
  switch (ctx.eventoSolicitado) {
    case 'CUBRICION':
      return ctx.cicloAbierto !== null
        ? { accion: 'reutilizar', cicloId: ctx.cicloAbierto.id }
        : { accion: 'crear',      cicloId: null }

    case 'CONFIRMACION_GESTACION':
      if (ctx.cicloAbierto === null) {
        throw new Error('No existe ciclo reproductivo abierto para confirmar gestación')
      }
      return { accion: 'reutilizar', cicloId: ctx.cicloAbierto.id }

    default:
      throw new Error(
        `ReproductiveCycleRules: evento '${ctx.eventoSolicitado}' no implementado aún`,
      )
  }
}
