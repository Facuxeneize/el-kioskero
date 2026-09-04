import { Prisma, type SaleStatus } from '@prisma/client'

import { prisma } from '../../config/database.js'
import { logger } from '../../config/logger.js'
import { AppError } from '../../shared/errors/app-error.js'
import { businessDayRange } from '../../shared/utils/business-date.js'
import { assertAvailableStock, consolidateSaleItems, type RequestedSaleItem } from './sale.calculations.js'

export const saleSelect = {
  id: true,
  saleNumber: true,
  total: true,
  totalUnits: true,
  status: true,
  createdAt: true,
  voidedAt: true,
  items: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true,
      productId: true,
      productName: true,
      barcode: true,
      quantity: true,
      unitPrice: true,
      subtotal: true,
    },
  },
} satisfies Prisma.SaleSelect

type PersistedSale = Prisma.SaleGetPayload<{ select: typeof saleSelect }>

export function serializeSale(sale: PersistedSale) {
  return {
    ...sale,
    saleNumber: sale.saleNumber.toString(),
    total: sale.total.toFixed(2),
    items: sale.items.map((item) => ({
      ...item,
      unitPrice: item.unitPrice.toFixed(2),
      subtotal: item.subtotal.toFixed(2),
    })),
  }
}

async function serializableTransaction<T>(operation: (transaction: Prisma.TransactionClient) => Promise<T>) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
    } catch (error) {
      const isWriteConflict = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034'
      if (!isWriteConflict) throw error
      if (attempt === 3) {
        throw new AppError(409, 'SALE_CONFLICT', 'El stock cambió durante la operación. Intentá nuevamente.')
      }
    }
  }
  throw new AppError(409, 'SALE_CONFLICT', 'No se pudo completar la operación. Intentá nuevamente.')
}

export async function createSale(userId: string, requestedItems: RequestedSaleItem[], idempotencyKey?: string) {
  if (idempotencyKey) {
    const existing = await prisma.sale.findUnique({
      where: { createdById_idempotencyKey: { createdById: userId, idempotencyKey } },
      select: saleSelect,
    })
    if (existing) return serializeSale(existing)
  }

  const consolidatedItems = consolidateSaleItems(requestedItems)

  try {
    const sale = await serializableTransaction(async (transaction) => {
      if (idempotencyKey) {
        const existing = await transaction.sale.findUnique({
          where: { createdById_idempotencyKey: { createdById: userId, idempotencyKey } },
          select: saleSelect,
        })
        if (existing) return existing
      }

      const products = await transaction.product.findMany({
        where: { ownerId: userId, id: { in: consolidatedItems.map((item) => item.productId) } },
      })
      const productsById = new Map(products.map((product) => [product.id, product]))
      let total = new Prisma.Decimal(0)
      let totalUnits = 0

      const preparedItems = consolidatedItems.map((item) => {
        const product = productsById.get(item.productId)
        if (!product || !product.isActive) {
          throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Uno de los productos no está disponible.')
        }
        assertAvailableStock(product.name, product.currentStock, item.quantity)
        const subtotal = product.salePrice.mul(item.quantity)
        total = total.add(subtotal)
        totalUnits += item.quantity
        return { product, quantity: item.quantity, subtotal }
      })

      const created = await transaction.sale.create({
        data: {
          createdById: userId,
          idempotencyKey,
          total,
          totalUnits,
          items: {
            create: preparedItems.map(({ product, quantity, subtotal }) => ({
              productId: product.id,
              productName: product.name,
              barcode: product.barcode,
              quantity,
              unitPrice: product.salePrice,
              subtotal,
            })),
          },
        },
        select: saleSelect,
      })

      for (const { product, quantity } of preparedItems) {
        const stockAfter = product.currentStock - quantity
        const update = await transaction.product.updateMany({
          where: { id: product.id, ownerId: userId, isActive: true, currentStock: { gte: quantity } },
          data: { currentStock: { decrement: quantity } },
        })
        if (update.count !== 1) {
          throw new AppError(409, 'INSUFFICIENT_STOCK', `Stock insuficiente para ${product.name}.`)
        }
        await transaction.stockMovement.create({
          data: {
            productId: product.id,
            userId,
            movementType: 'SALE',
            quantityDelta: -quantity,
            stockBefore: product.currentStock,
            stockAfter,
            referenceType: 'SALE',
            referenceId: created.id,
            notes: `Venta #${created.saleNumber.toString()}`,
          },
        })
      }

      return created
    })

    logger.info({ saleId: sale.id, saleNumber: sale.saleNumber.toString() }, 'Venta creada')
    return serializeSale(sale)
  } catch (error) {
    const isUniqueConflict = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
    if (isUniqueConflict && idempotencyKey) {
      const existing = await prisma.sale.findUnique({
        where: { createdById_idempotencyKey: { createdById: userId, idempotencyKey } },
        select: saleSelect,
      })
      if (existing) return serializeSale(existing)
    }
    throw error
  }
}

export async function listSales(input: {
  userId: string
  status?: SaleStatus
  dateFrom?: string
  dateTo?: string
  page: number
  pageSize: number
}) {
  const createdAt: Prisma.DateTimeFilter = {}
  if (input.dateFrom) createdAt.gte = businessDayRange(input.dateFrom).from
  if (input.dateTo) createdAt.lt = businessDayRange(input.dateTo).to
  const where: Prisma.SaleWhereInput = {
    createdById: input.userId,
    ...(input.status ? { status: input.status } : {}),
    ...(Object.keys(createdAt).length ? { createdAt } : {}),
  }

  const [items, total] = await prisma.$transaction([
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      select: saleSelect,
    }),
    prisma.sale.count({ where }),
  ])
  return {
    items: items.map(serializeSale),
    pagination: { page: input.page, pageSize: input.pageSize, total },
  }
}

export async function getSale(id: string, userId: string) {
  const sale = await prisma.sale.findFirst({ where: { id, createdById: userId }, select: saleSelect })
  if (!sale) throw new AppError(404, 'SALE_NOT_FOUND', 'Venta no encontrada.')
  return serializeSale(sale)
}

export async function voidSale(id: string, userId: string) {
  const sale = await serializableTransaction(async (transaction) => {
    const currentSale = await transaction.sale.findFirst({ where: { id, createdById: userId }, select: saleSelect })
    if (!currentSale) throw new AppError(404, 'SALE_NOT_FOUND', 'Venta no encontrada.')
    if (currentSale.status === 'VOIDED') {
      throw new AppError(409, 'SALE_ALREADY_VOIDED', 'La venta ya fue anulada.')
    }

    const statusUpdate = await transaction.sale.updateMany({
      where: { id, createdById: userId, status: 'COMPLETED' },
      data: { status: 'VOIDED', voidedAt: new Date() },
    })
    if (statusUpdate.count !== 1) {
      throw new AppError(409, 'SALE_ALREADY_VOIDED', 'La venta ya fue anulada.')
    }

    for (const item of currentSale.items) {
      const product = await transaction.product.findFirst({ where: { id: item.productId, ownerId: userId } })
      if (!product) throw new AppError(409, 'PRODUCT_NOT_FOUND', 'No se puede restituir un producto inexistente.')
      const stockAfter = product.currentStock + item.quantity
      await transaction.product.update({
        where: { id: product.id },
        data: { currentStock: { increment: item.quantity } },
      })
      await transaction.stockMovement.create({
        data: {
          productId: product.id,
          userId,
          movementType: 'SALE_VOID',
          quantityDelta: item.quantity,
          stockBefore: product.currentStock,
          stockAfter,
          referenceType: 'SALE',
          referenceId: currentSale.id,
          notes: `Anulación venta #${currentSale.saleNumber.toString()}`,
        },
      })
    }

    return transaction.sale.findUniqueOrThrow({ where: { id }, select: saleSelect })
  })

  logger.info({ saleId: sale.id, saleNumber: sale.saleNumber.toString() }, 'Venta anulada')
  return serializeSale(sale)
}
