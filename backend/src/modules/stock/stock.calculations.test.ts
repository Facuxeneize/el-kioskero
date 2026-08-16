import { describe, expect, it } from 'vitest'

import { AppError } from '../../shared/errors/app-error.js'
import { calculateStockChange } from './stock.calculations.js'

describe('calculateStockChange', () => {
  it('calcula un ingreso de mercadería', () => {
    expect(calculateStockChange(10, 34)).toEqual({
      stockBefore: 10,
      quantityDelta: 24,
      stockAfter: 34,
    })
  })

  it('calcula un ajuste por conteo físico', () => {
    expect(calculateStockChange(20, 18)).toEqual({
      stockBefore: 20,
      quantityDelta: -2,
      stockAfter: 18,
    })
  })

  it('rechaza stock negativo', () => {
    expect(() => calculateStockChange(2, -1)).toThrowError(AppError)
  })

  it('rechaza movimientos sin cambios', () => {
    expect(() => calculateStockChange(5, 5)).toThrowError('El ajuste no modifica el stock actual.')
  })
})
