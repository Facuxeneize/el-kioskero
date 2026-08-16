import { describe, expect, it } from 'vitest'

import { AppError } from '../../shared/errors/app-error.js'
import { assertAvailableStock, consolidateSaleItems } from './sale.calculations.js'

describe('sale calculations', () => {
  it('consolida productos repetidos antes de validar stock', () => {
    expect(consolidateSaleItems([
      { productId: 'product-a', quantity: 2 },
      { productId: 'product-a', quantity: 3 },
      { productId: 'product-b', quantity: 1 },
    ])).toEqual([
      { productId: 'product-a', quantity: 5 },
      { productId: 'product-b', quantity: 1 },
    ])
  })

  it('rechaza cantidades no positivas', () => {
    expect(() => consolidateSaleItems([{ productId: 'product-a', quantity: 0 }])).toThrowError(AppError)
  })

  it('acepta vender exactamente el stock disponible', () => {
    expect(() => assertAvailableStock('Agua', 3, 3)).not.toThrow()
  })

  it('rechaza una cantidad mayor al stock disponible', () => {
    expect(() => assertAvailableStock('Agua', 3, 4)).toThrowError('Stock insuficiente para Agua.')
  })
})
