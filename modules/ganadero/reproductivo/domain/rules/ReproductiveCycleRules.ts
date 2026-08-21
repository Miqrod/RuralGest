import type { ReproductiveContext, ReproductiveCycleDecision } from '../types'

// Responde a: ¿qué ciclo_id debe usarse para registrar este evento?
// Opera exclusivamente sobre el contexto (datos ya cargados por el Use Case).
// No accede a la DB, no crea ni cierra ciclos — eso lo hace el Use Case o el RPC.
//
// Regla fundamental: el ciclo debe existir previamente.
// Se crea al convertirse el animal en REPRODUCTORA (o tras un desenlace: Parto, Aborto,
// Machorra). Ni CUBRICION ni CONFIRMACION crean ciclos.
//
// El PARTO fija resultado='parto' en el ciclo actual, pero el ciclo NO queda bloqueado:
// puede seguir recibiendo eventos históricos (destetes). En paralelo, si la madre sigue
// siendo reproductora, el RPC abre un nuevo ciclo_id en 'vacia'.
//
// DESTETE se gestiona en su propio Use Case; no pasa por evalCycleRules.
export function evalCycleRules(ctx: ReproductiveContext): ReproductiveCycleDecision {
  switch (ctx.eventoSolicitado) {
    case 'CUBRICION':
    case 'CONFIRMACION_GESTACION':
    case 'PARTO':
    case 'ABORTO':
      if (ctx.cicloAbierto === null) {
        throw new Error(
          `${ctx.eventoSolicitado} requiere un ciclo reproductivo existente. ` +
          `El ciclo se crea al convertirse el animal en REPRODUCTORA.`
        )
      }
      return { accion: 'reutilizar', cicloId: ctx.cicloAbierto.id }

    default:
      throw new Error(
        `ReproductiveCycleRules: evento '${ctx.eventoSolicitado}' no gestionado aquí`,
      )
  }
}

// Determina si debe abrirse un nuevo ciclo VACÍA tras un desenlace reproductivo
// (Aborto, Parto, Machorra). Solo aplica cuando la madre sigue siendo reproductora.
// Si ya no lo es, la historia reproductiva queda consultable pero sin ciclo activo.
export function shouldCreateNewCycleAfterDesenlace(esReproductora: boolean): boolean {
  return esReproductora
}
