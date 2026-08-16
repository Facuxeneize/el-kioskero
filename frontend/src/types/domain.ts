export interface Product {
  id: string
  barcode: string
  name: string
  description: string | null
  salePrice: string
  currentStock: number
  minimumStock: number
  isActive: boolean
  lastStockInAt: string | null
}

export interface StockMovement {
  id: string
  productId: string
  movementType: 'IN' | 'SALE' | 'ADJUSTMENT' | 'SALE_VOID'
  quantityDelta: number
  stockBefore: number
  stockAfter: number
  notes: string | null
  createdAt: string
  product: Pick<Product, 'name' | 'barcode'>
}

export interface SaleItem {
  id: string
  productId: string
  productName: string
  barcode: string
  quantity: number
  unitPrice: string
  subtotal: string
}

export interface Sale {
  id: string
  saleNumber: number
  total: string
  totalUnits: number
  status: 'COMPLETED' | 'VOIDED'
  createdAt: string
  voidedAt: string | null
  items: SaleItem[]
}

export interface Paginated<T> {
  items: T[]
  pagination: { page: number; pageSize: number; total: number }
}

export interface DashboardSummary {
  revenueToday: string
  salesToday: number
  unitsToday: number
  lowStock: number
  outOfStock: number
}

export interface TopProduct {
  productId: string
  productName: string
  quantity: number
}
