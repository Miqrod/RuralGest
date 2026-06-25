import { describe, it, expect } from 'vitest'

import { assertFechaNacimientoPresente } from '@/modules/ganadero/animales/domain/rules'
import { mapCompraInputToRpcArgs } from '@/modules/ganadero/animales/infrastructure/mapper'
import type { RegistrarCompraAnimalInput } from '@/modules/ganadero/animales/domain/types'

const BASE_INPUT: RegistrarCompraAnimalInput = {
  especie:           'vacuno',
  sexo:              'hembra',
  tipo_productivo_id: 'uuid-tipo',
  fecha_compra:       '2024-03-15',
  crotal:             'ES001234',
  num_hierro:         null,
  raza_id:            'uuid-raza',
  fecha_nacimiento:   '2022-01-10',
  fecha_nacimiento_estimada: null,
  lote_id:            null,
}

describe('EVAL: Compra de animal — reglas de dominio', () => {

  it('acepta cuando hay fecha_nacimiento', () => {
    expect(() => assertFechaNacimientoPresente(BASE_INPUT)).not.toThrow()
  })

  it('acepta cuando solo hay fecha_nacimiento_estimada', () => {
    expect(() => assertFechaNacimientoPresente({
      fecha_nacimiento: null,
      fecha_nacimiento_estimada: '2022-01-01',
    })).not.toThrow()
  })

  it('lanza si no hay ninguna fecha de nacimiento', () => {
    expect(() => assertFechaNacimientoPresente({
      fecha_nacimiento: null,
      fecha_nacimiento_estimada: null,
    })).toThrow('Se requiere fecha_nacimiento o fecha_nacimiento_estimada')
  })

})

describe('EVAL: Compra de animal — mapper RPC', () => {

  it('traduce campos obligatorios correctamente (hembra)', () => {
    const args = mapCompraInputToRpcArgs(BASE_INPUT)
    expect(args.p_especie).toBe('vacuno')
    expect(args.p_sexo).toBe('hembra')
    expect(args.p_tipo_productivo_id).toBe('uuid-tipo')
    expect(args.p_fecha_compra).toBe('2024-03-15')
    expect(args.p_crotal).toBe('ES001234')
  })

  it('traduce campos obligatorios correctamente (macho)', () => {
    // Tanto machos como hembras pueden registrarse como compra
    const args = mapCompraInputToRpcArgs({ ...BASE_INPUT, sexo: 'macho' })
    expect(args.p_sexo).toBe('macho')
  })

  it('convierte null a undefined en campos opcionales', () => {
    const args = mapCompraInputToRpcArgs({ ...BASE_INPUT, num_hierro: null, lote_id: null })
    expect(args.p_num_hierro).toBeUndefined()
    expect(args.p_lote_id).toBeUndefined()
  })

  it('preserva valores opcionales cuando están presentes', () => {
    const args = mapCompraInputToRpcArgs({ ...BASE_INPUT, num_hierro: 'H-42', lote_id: 'uuid-lote' })
    expect(args.p_num_hierro).toBe('H-42')
    expect(args.p_lote_id).toBe('uuid-lote')
  })

})
