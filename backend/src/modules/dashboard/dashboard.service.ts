import { prisma } from '../../config/database.js'
import { businessDayRange, currentBusinessDate } from '../../shared/utils/business-date.js'
import { saleSelect, serializeSale } from '../sales/sale.service.js'

export async function getDashboardSummary() {
  const range = businessDayRange(currentBusinessDate())
  const [today, activeProducts] = await prisma.$transaction([
    prisma.sale.aggregate({
      where: { status: 'COMPLETED', createdAt: { gte: range.from, lt: range.to } },
      _sum: { total: true, totalUnits: true },
      _count: { _all: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { currentStock: true, minimumStock: true },
    }),
  ])

  return {
    revenueToday: today._sum.total?.toFixed(2) ?? '0.00',
    salesToday: today._count._all,
    unitsToday: today._sum.totalUnits ?? 0,
    lowStock: activeProducts.filter((product) => product.currentStock > 0 && product.currentStock <= product.minimumStock).length,
    outOfStock: activeProducts.filter((product) => product.currentStock === 0).length,
  }
}

export async function getTopProducts() {
  const grouped = await prisma.saleItem.groupBy({
    by: ['productId'],
    where: { sale: { status: 'COMPLETED' } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5,
  })
  const products = await prisma.product.findMany({
    where: { id: { in: grouped.map((item) => item.productId) } },
    select: { id: true, name: true },
  })
  const namesById = new Map(products.map((product) => [product.id, product.name]))

  return grouped.map((item) => ({
    productId: item.productId,
    productName: namesById.get(item.productId) ?? 'Producto histórico',
    quantity: item._sum.quantity ?? 0,
  }))
}

export async function getRecentSales() {
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: saleSelect,
  })
  return sales.map(serializeSale)
}
