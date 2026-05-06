import { validarTransicion } from '../lib/domain/reproductiveState'
import { describe, it, expect } from 'vitest'

describe('Reproductive state machine', () => {

  it('permite cubrición válida', () => {
    const result = validarTransicion('CUBRICION', 'VACIA')
    expect(result).toBe('GESTANTE')
  })

  it('bloquea parto inválido', () => {
    expect(() =>
      validarTransicion('PARTO', 'VACIA')
    ).toThrow()
  })

})