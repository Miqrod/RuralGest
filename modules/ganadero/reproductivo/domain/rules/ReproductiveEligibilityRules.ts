import type { ReproductiveContext } from '../types'
import type { EstadoVital, EstadoVinculoMaterno } from '@/modules/ganadero/shared/domain/types'
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

// ---------------------------------------------------------------------------
// Elegibilidad de destete — sujeto: la cría (no la madre)
// ---------------------------------------------------------------------------

// Datos mínimos necesarios para evaluar si una cría puede ser destetada.
export interface CriaParaDestete {
  tipo_productivo_nombre: string | null
  estado_vital: EstadoVital
  estado_vinculo_materno: EstadoVinculoMaterno | null
  madre_id: string | null
}

export function canWean(cria: CriaParaDestete): boolean {
  return getWeaningBlockers(cria).length === 0
}

export function getWeaningBlockers(cria: CriaParaDestete): string[] {
  const blockers: string[] = []

  // La cría debe estar en etapa productiva 'Cría' (aún no destetada).
  // Si ya es 'Recría' u otro tipo, el destete ya fue registrado anteriormente.
  if (cria.tipo_productivo_nombre !== 'Cría') {
    blockers.push('El animal no está en etapa "Cría" — puede que ya haya sido destetado')
  }

  // No se puede destetar una cría que no está viva.
  if (cria.estado_vital !== 'vivo') {
    blockers.push(`El animal no está vivo (estado: ${cria.estado_vital})`)
  }

  // El vínculo materno debe estar activo — garantiza que existe la dependencia
  // funcional madre-cría que el destete debe cerrar.
  // NULL = sin información (historial previo a PRD010); 'finalizado' = ya cerrado.
  if (cria.estado_vinculo_materno !== 'activo') {
    const estado = cria.estado_vinculo_materno ?? 'desconocido'
    blockers.push(`El vínculo materno no está activo (estado: ${estado})`)
  }

  // Sin madre registrada no es posible cerrar la dependencia funcional.
  if (cria.madre_id === null) {
    blockers.push('La cría no tiene madre registrada')
  }

  return blockers
}
