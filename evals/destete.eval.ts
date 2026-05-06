
import { describe, it, expect } from 'vitest'
import { destetarCerda } from '@/application/use-cases/destetar'

describe('EVAL: Destete completo', () => {

  it('flujo correcto', async () => {

    const input = {
      madreId: '1',
      loteId: 'camada-1',
      cantidad: 10
    }

    const result = await destetarCerda(input)

    expect(result.success).toBe(true)

    // comprobar efectos
    expect(result.eventos.length).toBeGreaterThan(0)
    expect(result.estadoFinal).toBe('VACIA')

  })

  it('bloquea destete inválido', async () => {

    const input = {
      madreId: '1',
      loteId: 'camada-1',
      cantidad: 10,
      estadoActual: 'GESTANTE'
    }

    await expect(destetarCerda(input)).rejects.toThrow()

  })

})