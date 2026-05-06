
type FieldType = 'EDITABLE' | 'DERIVED' | 'SYSTEM'

const FIELD_CONFIG = {
  animal: {
    estado_vital: 'DERIVED',
    estado_reproductivo: 'DERIVED',
    estado_sanitario: 'DERIVED',
    crotal: 'EDITABLE',
    raza: 'EDITABLE'
  }
}

export function assertEditable(entity: keyof typeof FIELD_CONFIG, field: string) {
  const type = FIELD_CONFIG[entity][field]

  if (type === 'DERIVED' || type === 'SYSTEM') {
    throw new Error(`Campo ${field} no es editable`)
  }
}