// /tests/stock.test.ts

import { describe, it, expect } from 'vitest'
import { assertStockDisponible } from '../lib/validators/stock'

describe('Stock validation', () => {

  it('permite cantidad válida', () => {
    expect(() => assertStockDisponible(5, 10)).not.toThrow()
  })

  it('bloquea stock insuficiente', () => {
    expect(() => assertStockDisponible(15, 10)).toThrow()
  })

  it('bloquea cantidad negativa', () => {
    expect(() => assertStockDisponible(-1, 10)).toThrow()
  })

})