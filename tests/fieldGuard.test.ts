
import { assertEditable } from '../lib/guardrails/fieldGuard'
import { describe, it, expect } from 'vitest'

describe('Field guard', () => {

  it('permite editar campo editable', () => {
    expect(() =>
      assertEditable('animal', 'crotal')
    ).not.toThrow()
  })

  it('bloquea campo derivado', () => {
    expect(() =>
      assertEditable('animal', 'estado_reproductivo')
    ).toThrow()
  })

})