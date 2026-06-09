import type { UUID, ISODate } from '../../../../shared/types'
import type { Especie, Sexo } from '../../../shared/domain/types'

export interface RegistrarCompraAnimalInput {
  // Identidad del animal
  especie: Especie
  sexo: Sexo
  tipo_productivo_id: UUID
  crotal?: string
  num_hierro?: string
  raza_id?: UUID
  fecha_nacimiento?: ISODate
  fecha_nacimiento_estimada?: ISODate
  // Datos de la compra
  fecha_compra: ISODate
  precio_compra?: number
  proveedor_nombre?: string
  // Asignación inicial (opcional)
  lote_id?: UUID
}

export async function registrarCompra(
  _input: RegistrarCompraAnimalInput,
): Promise<{ id: UUID }> {
  throw new Error('not implemented')
}
