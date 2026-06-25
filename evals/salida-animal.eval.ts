import { describe, it, expect } from 'vitest'

import { assertAnimalPuedeSalir } from '@/modules/ganadero/animales/domain/rules'
import { mapVentaInputToRpcArgs, mapMuerteInputToRpcArgs } from '@/modules/ganadero/animales/infrastructure/mapper'

describe('EVAL: Salida de animal — reglas de dominio', () => {

  it('permite salida de animal vivo', () => {
    expect(() => assertAnimalPuedeSalir({ estado_vital: 'vivo', crotal: 'ES001' })).not.toThrow()
  })

  it('bloquea salida de animal ya vendido', () => {
    expect(() => assertAnimalPuedeSalir({ estado_vital: 'vendido', crotal: 'ES001' }))
      .toThrow(/no puede salir/)
  })

  it('bloquea salida de animal muerto', () => {
    expect(() => assertAnimalPuedeSalir({ estado_vital: 'muerto', crotal: 'ES001' }))
      .toThrow(/no puede salir/)
  })

  it('incluye el crotal en el mensaje de error cuando está disponible', () => {
    expect(() => assertAnimalPuedeSalir({ estado_vital: 'vendido', crotal: 'ES001' }))
      .toThrow(/crotal: ES001/)
  })

  it('funciona sin crotal (animal sin identificar)', () => {
    expect(() => assertAnimalPuedeSalir({ estado_vital: 'vendido', crotal: null }))
      .toThrow(/no puede salir/)
  })

})

describe('EVAL: Salida de animal — mappers RPC', () => {

  it('mapper de venta produce motivo "venta"', () => {
    const args = mapVentaInputToRpcArgs({ animal_id: 'uuid-animal', fecha_venta: '2024-06-01' })
    expect(args.p_animal_id).toBe('uuid-animal')
    expect(args.p_motivo).toBe('venta')
    expect(args.p_fecha).toBe('2024-06-01')
  })

  it('mapper de muerte produce motivo "muerte"', () => {
    const args = mapMuerteInputToRpcArgs({ animal_id: 'uuid-animal', fecha_muerte: '2024-06-01' })
    expect(args.p_animal_id).toBe('uuid-animal')
    expect(args.p_motivo).toBe('muerte')
    expect(args.p_fecha).toBe('2024-06-01')
  })

  it('venta y muerte comparten el mismo RPC pero con motivo distinto', () => {
    const venta  = mapVentaInputToRpcArgs({ animal_id: 'uuid-animal', fecha_venta: '2024-06-01' })
    const muerte = mapMuerteInputToRpcArgs({ animal_id: 'uuid-animal', fecha_muerte: '2024-06-01' })
    expect(venta.p_motivo).not.toBe(muerte.p_motivo)
    expect(venta.p_animal_id).toBe(muerte.p_animal_id)
  })

})
