import { AppError } from '../../shared/errors/app-error.js'

export function calculateStockChange(currentStock: number, desiredStock: number) {
  if (!Number.isInteger(currentStock) || !Number.isInteger(desiredStock)) {
    throw new AppError(422, 'INVALID_STOCK', 'El stock debe expresarse en unidades enteras.')
  }
  if (desiredStock < 0) {
    throw new AppError(409, 'NEGATIVE_STOCK', 'El stock no puede ser negativo.')
  }

  const quantityDelta = desiredStock - currentStock
  if (quantityDelta === 0) {
    throw new AppError(422, 'STOCK_UNCHANGED', 'El ajuste no modifica el stock actual.')
  }

  return { stockBefore: currentStock, quantityDelta, stockAfter: desiredStock }
}
