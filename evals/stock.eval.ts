
import { crearMovimiento } from '@/application/use-cases/movimiento'
import { describe, it, expect } from 'vitest'

describe('EVAL: Movimiento de stock', () => {

  it('mantiene coherencia entrada/salida', async () => {

    const result = await crearMovimiento({
      origen: 'loteA',
      destino: 'loteB',
      cantidad: 5
    })

    expect(result.success).toBe(true)

  })

  it('bloquea stock negativo', async () => {

    await expect(
      crearMovimiento({
        origen: 'loteA',
        destino: 'loteB',
        cantidad: 999
      })
    ).rejects.toThrow()

  })

})