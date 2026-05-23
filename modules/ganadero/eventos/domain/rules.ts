import type { TipoEvento, MotivoMovimiento } from './types'

export function assertEventoNoEditable(): never {
  throw new Error('Los eventos no se pueden editar')
}

export function assertTipoEventoActivo(tipoEvento: TipoEvento) {
  if (!tipoEvento.activo) {
    throw new Error(`TipoEvento ${tipoEvento.codigo} está inactivo`)
  }
}

export function assertMotivoRequerido(
  tipoEvento: TipoEvento,
  motivo: MotivoMovimiento | null,
) {
  if (tipoEvento.requiere_motivo && !motivo) {
    throw new Error(`El evento ${tipoEvento.codigo} requiere un motivo`)
  }
}
