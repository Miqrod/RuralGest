import type { ReproductiveContext } from '../types'
import { estadoPermiteEvento } from '../rules'

export interface EligibilityResult {
  eligible: boolean
  errors: string[]
}

// Responde únicamente a: ¿puede este animal recibir este evento reproductivo?
// No modifica estados, no crea ciclos, no proyecta información.
// El Use Case llama a esta función antes de invocar ReproductiveCycleRules.
export function checkEligibility(ctx: ReproductiveContext): EligibilityResult {
  const errors: string[] = []

  // Regla 1: solo hembras con tipo productivo 'Reproductora' pueden recibir eventos reproductivos.
  // es_reproductora lo calcula el backend (ver decisions.md § es_reproductora).
  if (!ctx.animal.es_reproductora) {
    errors.push('El animal no es reproductora (requiere hembra con tipo productivo "Reproductora")')
  }

  // Regla 2: el estado reproductivo actual debe permitir el evento solicitado.
  // null significa que el módulo reproductivo no aplica (es_reproductora = false),
  // y estadoPermiteEvento retorna false directamente en ese caso.
  if (!estadoPermiteEvento(ctx.animal.estado_reproductivo, ctx.eventoSolicitado)) {
    const estado = ctx.animal.estado_reproductivo ?? '(no aplica)'
    errors.push(`Estado '${estado}' no permite registrar el evento ${ctx.eventoSolicitado}`)
  }

  return { eligible: errors.length === 0, errors }
}
