import type { Prisma } from '@prisma/client'

import { prisma } from '../../config/database.js'
import { AppError } from '../../shared/errors/app-error.js'

export async function listProducts(input: {
  search?: string
  active?: boolean
  page: number
  pageSize: number
}) {
  const where: Prisma.ProductWhereInput = {
    ...(input.active === undefined ? {} : { isActive: input.active }),
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search } },
            { barcode: { contains: input.search } },
          ],
        }
      : {}),
  }

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      include: {
        stockMovements: {
          where: { movementType: 'IN' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ])

  return {
    items: items.map(({ stockMovements, ...product }) => ({
      ...product,
      lastStockInAt: stockMovements[0]?.createdAt ?? null,
    })),
    pagination: { page: input.page, pageSize: input.pageSize, total },
  }
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.')
  return product
}

export async function getProductByBarcode(barcode: string) {
  const product = await prisma.product.findUnique({ where: { barcode } })
  if (!product || !product.isActive) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.')
  }
  return product
}

export function createProduct(data: Prisma.ProductCreateInput) {
  return prisma.product.create({ data })
}

export async function updateProduct(id: string, data: Prisma.ProductUpdateInput) {
  await getProduct(id)
  return prisma.product.update({ where: { id }, data })
}

export async function deactivateProduct(id: string) {
  await getProduct(id)
  return prisma.product.update({ where: { id }, data: { isActive: false } })
}
