import { AppError } from '../../shared/errors/app-error.js'

export interface RequestedSaleItem {
  productId: string
  quantity: number
}

export function consolidateSaleItems(items: RequestedSaleItem[]) {
  const quantities = new Map<string, number>()
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new AppError(422, 'INVALID_QUANTITY', 'La cantidad debe ser mayor que cero.')
    }
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity)
  }
  return [...quantities].map(([productId, quantity]) => ({ productId, quantity }))
}

export function assertAvailableStock(productName: string, availableStock: number, requestedQuantity: number) {
  if (availableStock < requestedQuantity) {
    throw new AppError(409, 'INSUFFICIENT_STOCK', `Stock insuficiente para ${productName}.`)
  }
}
