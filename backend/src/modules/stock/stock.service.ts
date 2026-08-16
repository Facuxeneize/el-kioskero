import type { StockMovementType } from '@prisma/client'

import { prisma } from '../../config/database.js'
import { AppError } from '../../shared/errors/app-error.js'
import { calculateStockChange } from './stock.calculations.js'

async function changeStock(input: {
  productId: string
  userId: string
  desiredStock: (currentStock: number) => number
  movementType: StockMovementType
  notes?: string
}) {
  return prisma.$transaction(async (transaction) => {
    const product = await transaction.product.findUnique({ where: { id: input.productId } })
    if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.')
    if (!product.isActive) throw new AppError(409, 'PRODUCT_INACTIVE', 'El producto está inactivo.')

    const stockChange = calculateStockChange(product.currentStock, input.desiredStock(product.currentStock))

    const updated = await transaction.product.updateMany({
      where: { id: product.id, currentStock: product.currentStock },
      data: { currentStock: stockChange.stockAfter },
    })
    if (updated.count !== 1) {
      throw new AppError(409, 'STOCK_CONFLICT', 'El stock cambió durante la operación. Intentá nuevamente.')
    }

    const movement = await transaction.stockMovement.create({
      data: {
        productId: product.id,
        userId: input.userId,
        movementType: input.movementType,
        quantityDelta: stockChange.quantityDelta,
        stockBefore: stockChange.stockBefore,
        stockAfter: stockChange.stockAfter,
        referenceType: 'MANUAL',
        notes: input.notes,
      },
    })

    return { product: { ...product, currentStock: stockChange.stockAfter }, movement }
  })
}

export function addStock(productId: string, userId: string, quantity: number, notes?: string) {
  return changeStock({
    productId,
    userId,
    desiredStock: (currentStock) => currentStock + quantity,
    movementType: 'IN',
    notes,
  })
}

export function adjustStock(productId: string, userId: string, actualStock: number, notes: string) {
  return changeStock({
    productId,
    userId,
    desiredStock: () => actualStock,
    movementType: 'ADJUSTMENT',
    notes,
  })
}

export async function listStockMovements(input: { productId?: string; page: number; pageSize: number }) {
  const where = input.productId ? { productId: input.productId } : {}
  const [items, total] = await prisma.$transaction([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      include: { product: { select: { name: true, barcode: true } } },
    }),
    prisma.stockMovement.count({ where }),
  ])

  return { items, pagination: { page: input.page, pageSize: input.pageSize, total } }
}
