export type CategoriaParametrizacion = 'REPRODUCTIVO' | 'FINANCIERO' | 'OPERATIVO'
export type TipoValorParametrizacion = 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'TEXT' | 'DATE'
export type UnidadParametrizacion    = 'DIAS' | 'EUROS' | 'PORCENTAJE' | 'KG' | 'UNIDADES'

export interface Parametrizacion {
  id:          string
  codigo:      string
  descripcion: string
  valor:       string
  // NULL = parámetro global; valor = aplica solo a esa especie
  especie:     string | null
  categoria:   CategoriaParametrizacion
  tipo_valor:  TipoValorParametrizacion
  unidad:      UnidadParametrizacion | null
  created_at:  string
  updated_at:  string
  created_by:  string | null
  updated_by:  string | null
}
