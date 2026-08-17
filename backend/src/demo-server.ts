import { randomUUID } from 'node:crypto'

import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

type MovementType = 'IN' | 'SALE' | 'ADJUSTMENT' | 'SALE_VOID'
type SaleStatus = 'COMPLETED' | 'VOIDED'

interface Product {
  id: string
  barcode: string
  name: string
  description: string | null
  salePrice: string
  currentStock: number
  minimumStock: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface StockMovement {
  id: string
  productId: string
  movementType: MovementType
  quantityDelta: number
  stockBefore: number
  stockAfter: number
  notes: string | null
  referenceId: string | null
  createdAt: string
}

interface SaleItem {
  id: string
  productId: string
  productName: string
  barcode: string
  quantity: number
  unitPrice: string
  subtotal: string
}

interface Sale {
  id: string
  saleNumber: number
  total: string
  totalUnits: number
  status: SaleStatus
  createdAt: string
  voidedAt: string | null
  items: SaleItem[]
}

const app = express()
const port = 3000
const demoToken = 'kiosko-demo-access-token'
const demoCookie = 'kiosko_demo_session'
const now = new Date().toISOString()

const demoUser = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Facundo',
  username: 'admin',
  email: 'admin@kiosko.local',
  role: 'ADMIN' as const,
  lastLoginAt: now,
}

const products: Product[] = [
  { id: randomUUID(), barcode: '7790895001012', name: 'Coca-Cola 500 ml', description: 'Botella individual', salePrice: '2500.00', currentStock: 18, minimumStock: 6, isActive: true, createdAt: now, updatedAt: now },
  { id: randomUUID(), barcode: '7791234567890', name: 'Alfajor de chocolate', description: null, salePrice: '1200.00', currentStock: 4, minimumStock: 5, isActive: true, createdAt: now, updatedAt: now },
  { id: randomUUID(), barcode: '7790040123456', name: 'Agua mineral 500 ml', description: null, salePrice: '1400.00', currentStock: 0, minimumStock: 4, isActive: true, createdAt: now, updatedAt: now },
  { id: randomUUID(), barcode: '7790310001119', name: 'Papas fritas clásicas', description: null, salePrice: '2100.00', currentStock: 12, minimumStock: 4, isActive: true, createdAt: now, updatedAt: now },
  { id: randomUUID(), barcode: '7790742002221', name: 'Galletitas rellenas', description: null, salePrice: '1750.00', currentStock: 9, minimumStock: 3, isActive: true, createdAt: now, updatedAt: now },
]
const movements: StockMovement[] = []
const sales: Sale[] = []
const idempotentSales = new Map<string, string>()
let nextSaleNumber = 1001

function cents(value: string | number) {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Math.round(numeric * 100)
}

function money(valueInCents: number) {
  return (valueInCents / 100).toFixed(2)
}

function dateKey(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function productView(product: Product) {
  const lastStockInAt = movements.find((movement) => movement.productId === product.id && movement.movementType === 'IN')?.createdAt ?? null
  return { ...product, lastStockInAt }
}

function fail(response: express.Response, status: number, code: string, message: string) {
  return response.status(status).json({ success: false, error: { code, message } })
}

function addMovement(product: Product, movementType: MovementType, stockBefore: number, stockAfter: number, notes: string | null, referenceId: string | null, createdAt = new Date().toISOString()) {
  movements.unshift({
    id: randomUUID(), productId: product.id, movementType, quantityDelta: stockAfter - stockBefore,
    stockBefore, stockAfter, notes, referenceId, createdAt,
  })
}

function seedDemoData() {
  for (const product of products) {
    const sold = product === products[0] ? 2 : product === products[1] ? 1 : 0
    addMovement(product, 'IN', 0, product.currentStock + sold, 'Carga inicial de demostración', null, now)
  }
  const initialItems = [
    { product: products[0]!, quantity: 2 },
    { product: products[1]!, quantity: 1 },
  ]
  const saleId = randomUUID()
  const items = initialItems.map(({ product, quantity }) => ({
    id: randomUUID(), productId: product.id, productName: product.name, barcode: product.barcode,
    quantity, unitPrice: product.salePrice, subtotal: money(cents(product.salePrice) * quantity),
  }))
  sales.push({
    id: saleId, saleNumber: nextSaleNumber++, total: money(items.reduce((sum, item) => sum + cents(item.subtotal), 0)),
    totalUnits: 3, status: 'COMPLETED', createdAt: now, voidedAt: null, items,
  })
  addMovement(products[0]!, 'SALE', 20, 18, 'Venta de demostración', saleId, now)
  addMovement(products[1]!, 'SALE', 5, 4, 'Venta de demostración', saleId, now)
}

seedDemoData()

app.use(helmet())
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/health', (_request, response) => response.json({ success: true, data: { status: 'demo' } }))

app.post('/api/v1/auth/login', (request, response) => {
  if (request.body.email !== demoUser.email || request.body.password !== 'kiosko-demo') {
    fail(response, 401, 'INVALID_CREDENTIALS', 'Email o contraseña incorrectos.')
    return
  }
  response.cookie(demoCookie, 'active', { httpOnly: true, sameSite: 'strict', path: '/api/v1/auth' })
  response.json({ success: true, data: { user: demoUser, accessToken: demoToken } })
})

app.post('/api/v1/auth/refresh', (request, response) => {
  if (request.cookies[demoCookie] !== 'active') {
    fail(response, 401, 'INVALID_REFRESH_TOKEN', 'La sesión no es válida o expiró.')
    return
  }
  response.json({ success: true, data: { accessToken: demoToken } })
})

app.post('/api/v1/auth/logout', (_request, response) => {
  response.clearCookie(demoCookie, { path: '/api/v1/auth' })
  response.json({ success: true, data: null })
})

app.use('/api/v1', (request, response, next) => {
  if (request.header('authorization') !== `Bearer ${demoToken}`) {
    fail(response, 401, 'UNAUTHENTICATED', 'Debés iniciar sesión.')
    return
  }
  next()
})

app.get('/api/v1/auth/me', (_request, response) => response.json({ success: true, data: demoUser }))

app.get('/api/v1/products', (request, response) => {
  const search = String(request.query.search ?? '').toLocaleLowerCase('es')
  const active = request.query.active === undefined ? undefined : request.query.active === 'true'
  const items = products
    .filter((product) => active === undefined || product.isActive === active)
    .filter((product) => product.name.toLocaleLowerCase('es').includes(search) || product.barcode.includes(search))
    .sort((left, right) => left.name.localeCompare(right.name, 'es'))
    .map(productView)
  response.json({ success: true, data: { items, pagination: { page: 1, pageSize: 100, total: items.length } } })
})

app.get('/api/v1/products/barcode/:barcode', (request, response) => {
  const product = products.find((candidate) => candidate.barcode === request.params.barcode && candidate.isActive)
  if (!product) return fail(response, 404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.')
  return response.json({ success: true, data: productView(product) })
})

app.get('/api/v1/products/:id', (request, response) => {
  const product = products.find((candidate) => candidate.id === request.params.id)
  if (!product) return fail(response, 404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.')
  return response.json({ success: true, data: productView(product) })
})

app.post('/api/v1/products', (request, response) => {
  const { barcode, name, description, salePrice, minimumStock } = request.body as Record<string, unknown>
  if (!barcode || !name || cents(String(salePrice)) < 0 || !Number.isInteger(minimumStock) || Number(minimumStock) < 0) {
    return fail(response, 422, 'VALIDATION_ERROR', 'Revisá los datos del producto.')
  }
  if (products.some((product) => product.barcode === String(barcode))) {
    return fail(response, 409, 'BARCODE_ALREADY_EXISTS', 'Ya existe un producto con ese código de barras.')
  }
  const createdAt = new Date().toISOString()
  const product: Product = {
    id: randomUUID(), barcode: String(barcode).trim(), name: String(name).trim(), description: description ? String(description).trim() : null,
    salePrice: money(cents(String(salePrice))), currentStock: 0, minimumStock: Number(minimumStock), isActive: true, createdAt, updatedAt: createdAt,
  }
  products.push(product)
  return response.status(201).json({ success: true, data: productView(product) })
})

app.patch('/api/v1/products/:id', (request, response) => {
  const product = products.find((candidate) => candidate.id === request.params.id)
  if (!product) return fail(response, 404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.')
  const input = request.body as Partial<Product>
  if (input.barcode && products.some((candidate) => candidate.id !== product.id && candidate.barcode === input.barcode)) {
    return fail(response, 409, 'BARCODE_ALREADY_EXISTS', 'Ya existe un producto con ese código de barras.')
  }
  if (input.name !== undefined) product.name = input.name.trim()
  if (input.barcode !== undefined) product.barcode = input.barcode.trim()
  if (input.description !== undefined) product.description = input.description?.trim() || null
  if (input.salePrice !== undefined) product.salePrice = money(cents(input.salePrice))
  if (input.minimumStock !== undefined) product.minimumStock = input.minimumStock
  if (input.isActive !== undefined) product.isActive = input.isActive
  product.updatedAt = new Date().toISOString()
  return response.json({ success: true, data: productView(product) })
})

app.delete('/api/v1/products/:id', (request, response) => {
  const product = products.find((candidate) => candidate.id === request.params.id)
  if (!product) return fail(response, 404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.')
  product.isActive = false
  product.updatedAt = new Date().toISOString()
  return response.json({ success: true, data: productView(product) })
})

app.get('/api/v1/stock/movements', (request, response) => {
  const productId = request.query.productId ? String(request.query.productId) : undefined
  const items = movements
    .filter((movement) => !productId || movement.productId === productId)
    .map((movement) => ({ ...movement, product: products.find((product) => product.id === movement.productId) }))
  return response.json({ success: true, data: { items, pagination: { page: 1, pageSize: 100, total: items.length } } })
})

app.get('/api/v1/products/:id/stock/movements', (request, response) => {
  const items = movements.filter((movement) => movement.productId === request.params.id).map((movement) => ({ ...movement, product: products.find((product) => product.id === movement.productId) }))
  return response.json({ success: true, data: { items, pagination: { page: 1, pageSize: 100, total: items.length } } })
})

app.post('/api/v1/products/:id/stock/in', (request, response) => {
  const product = products.find((candidate) => candidate.id === request.params.id)
  const quantity = Number(request.body.quantity)
  if (!product) return fail(response, 404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.')
  if (!Number.isInteger(quantity) || quantity <= 0) return fail(response, 422, 'VALIDATION_ERROR', 'La cantidad debe ser mayor que cero.')
  const stockBefore = product.currentStock
  product.currentStock += quantity
  product.updatedAt = new Date().toISOString()
  addMovement(product, 'IN', stockBefore, product.currentStock, request.body.notes || null, null)
  return response.status(201).json({ success: true, data: { product: productView(product), movement: movements[0] } })
})

app.post('/api/v1/products/:id/stock/adjustment', (request, response) => {
  const product = products.find((candidate) => candidate.id === request.params.id)
  const actualStock = Number(request.body.actualStock)
  if (!product) return fail(response, 404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.')
  if (!Number.isInteger(actualStock) || actualStock < 0) return fail(response, 422, 'VALIDATION_ERROR', 'El stock real debe ser cero o mayor.')
  if (actualStock === product.currentStock) return fail(response, 422, 'STOCK_UNCHANGED', 'El ajuste no modifica el stock actual.')
  const stockBefore = product.currentStock
  product.currentStock = actualStock
  product.updatedAt = new Date().toISOString()
  addMovement(product, 'ADJUSTMENT', stockBefore, actualStock, request.body.notes || 'Ajuste manual', null)
  return response.status(201).json({ success: true, data: { product: productView(product), movement: movements[0] } })
})

app.post('/api/v1/sales', (request, response) => {
  const requestedItems = request.body.items as Array<{ productId: string; quantity: number }> | undefined
  if (!requestedItems?.length) return fail(response, 422, 'EMPTY_SALE', 'Agregá al menos un producto a la venta.')
  const quantities = new Map<string, number>()
  for (const item of requestedItems) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + Number(item.quantity))

  const prepared: Array<{ product: Product; quantity: number }> = []
  for (const [productId, quantity] of quantities) {
    const product = products.find((candidate) => candidate.id === productId)
    if (!product || !product.isActive) return fail(response, 404, 'PRODUCT_NOT_FOUND', 'Uno de los productos no está disponible.')
    if (!Number.isInteger(quantity) || quantity <= 0) return fail(response, 422, 'INVALID_QUANTITY', 'La cantidad debe ser mayor que cero.')
    if (product.currentStock < quantity) return fail(response, 409, 'INSUFFICIENT_STOCK', `Stock insuficiente para ${product.name}.`)
    prepared.push({ product, quantity })
  }

  const idempotencyKey = request.header('idempotency-key')
  const existingId = idempotencyKey ? idempotentSales.get(idempotencyKey) : undefined
  if (existingId) return response.json({ success: true, data: sales.find((sale) => sale.id === existingId) })

  const id = randomUUID()
  const createdAt = new Date().toISOString()
  const items: SaleItem[] = prepared.map(({ product, quantity }) => ({
    id: randomUUID(), productId: product.id, productName: product.name, barcode: product.barcode, quantity,
    unitPrice: product.salePrice, subtotal: money(cents(product.salePrice) * quantity),
  }))
  const sale: Sale = {
    id, saleNumber: nextSaleNumber++, total: money(items.reduce((sum, item) => sum + cents(item.subtotal), 0)),
    totalUnits: items.reduce((sum, item) => sum + item.quantity, 0), status: 'COMPLETED', createdAt, voidedAt: null, items,
  }
  for (const { product, quantity } of prepared) {
    const stockBefore = product.currentStock
    product.currentStock -= quantity
    addMovement(product, 'SALE', stockBefore, product.currentStock, `Venta #${sale.saleNumber}`, id)
  }
  sales.unshift(sale)
  if (idempotencyKey) idempotentSales.set(idempotencyKey, id)
  return response.status(201).json({ success: true, data: sale })
})

app.get('/api/v1/sales', (request, response) => {
  const status = request.query.status ? String(request.query.status) : undefined
  const from = request.query.dateFrom ? String(request.query.dateFrom) : undefined
  const to = request.query.dateTo ? String(request.query.dateTo) : undefined
  const items = sales.filter((sale) => (!status || sale.status === status) && (!from || dateKey(sale.createdAt) >= from) && (!to || dateKey(sale.createdAt) <= to))
  return response.json({ success: true, data: { items, pagination: { page: 1, pageSize: 100, total: items.length } } })
})

app.get('/api/v1/sales/:id', (request, response) => {
  const sale = sales.find((candidate) => candidate.id === request.params.id)
  if (!sale) return fail(response, 404, 'SALE_NOT_FOUND', 'Venta no encontrada.')
  return response.json({ success: true, data: sale })
})

app.post('/api/v1/sales/:id/void', (request, response) => {
  const sale = sales.find((candidate) => candidate.id === request.params.id)
  if (!sale) return fail(response, 404, 'SALE_NOT_FOUND', 'Venta no encontrada.')
  if (sale.status === 'VOIDED') return fail(response, 409, 'SALE_ALREADY_VOIDED', 'La venta ya fue anulada.')
  const voidedAt = new Date().toISOString()
  for (const item of sale.items) {
    const product = products.find((candidate) => candidate.id === item.productId)!
    const stockBefore = product.currentStock
    product.currentStock += item.quantity
    addMovement(product, 'SALE_VOID', stockBefore, product.currentStock, `Anulación venta #${sale.saleNumber}`, sale.id, voidedAt)
  }
  sale.status = 'VOIDED'
  sale.voidedAt = voidedAt
  return response.json({ success: true, data: sale })
})

app.get('/api/v1/dashboard/summary', (_request, response) => {
  const today = dateKey(new Date())
  const completedToday = sales.filter((sale) => sale.status === 'COMPLETED' && dateKey(sale.createdAt) === today)
  const data = {
    revenueToday: money(completedToday.reduce((sum, sale) => sum + cents(sale.total), 0)),
    salesToday: completedToday.length,
    unitsToday: completedToday.reduce((sum, sale) => sum + sale.totalUnits, 0),
    lowStock: products.filter((product) => product.isActive && product.currentStock > 0 && product.currentStock <= product.minimumStock).length,
    outOfStock: products.filter((product) => product.isActive && product.currentStock === 0).length,
  }
  return response.json({ success: true, data })
})

app.get('/api/v1/dashboard/top-products', (_request, response) => {
  const totals = new Map<string, { productId: string; productName: string; quantity: number }>()
  for (const sale of sales.filter((candidate) => candidate.status === 'COMPLETED')) {
    for (const item of sale.items) {
      const current = totals.get(item.productId) ?? { productId: item.productId, productName: item.productName, quantity: 0 }
      current.quantity += item.quantity
      totals.set(item.productId, current)
    }
  }
  return response.json({ success: true, data: [...totals.values()].sort((left, right) => right.quantity - left.quantity).slice(0, 5) })
})

app.get('/api/v1/dashboard/recent-sales', (_request, response) => {
  return response.json({ success: true, data: sales.slice(0, 5) })
})

app.listen(port, () => {
  console.info(`API demo disponible en http://localhost:${port}`)
})
