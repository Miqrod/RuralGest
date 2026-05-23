import type { UUID, ISODate, ISOTimestamp } from '../../../shared/types'
import type { ResultadoCiclo } from '../../shared/domain/types'

export interface CicloReproductivo {
  id: UUID
  animal_id: UUID
  numero_ciclo: number
  fecha_inicio: ISODate
  fecha_fin: ISODate | null
  resultado: ResultadoCiclo | null
  created_at: ISOTimestamp
  created_by: UUID | null
}
