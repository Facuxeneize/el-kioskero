import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

const app = express()
const port = 3000
const demoToken = 'kiosko-demo-access-token'
const demoCookie = 'kiosko_demo_session'

const demoUser = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Facundo',
  email: 'admin@kiosko.local',
  role: 'ADMIN' as const,
  lastLoginAt: new Date().toISOString(),
}

const products = [
  { id: '1', barcode: '7790895001012', name: 'Coca-Cola 500 ml', salePrice: '2500.00', currentStock: 18, minimumStock: 6, isActive: true },
  { id: '2', barcode: '7791234567890', name: 'Alfajor de chocolate', salePrice: '1200.00', currentStock: 4, minimumStock: 5, isActive: true },
  { id: '3', barcode: '7790040123456', name: 'Agua mineral 500 ml', salePrice: '1400.00', currentStock: 0, minimumStock: 4, isActive: true },
  { id: '4', barcode: '7790310001119', name: 'Papas fritas clásicas', salePrice: '2100.00', currentStock: 12, minimumStock: 4, isActive: true },
  { id: '5', barcode: '7790742002221', name: 'Galletitas rellenas', salePrice: '1750.00', currentStock: 9, minimumStock: 3, isActive: true },
]

app.use(helmet())
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/health', (_request, response) => response.json({ success: true, data: { status: 'demo' } }))

app.post('/api/v1/auth/login', (request, response) => {
  if (request.body.email !== demoUser.email || request.body.password !== 'kiosko-demo') {
    response.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Email o contraseña incorrectos.' } })
    return
  }
  response.cookie(demoCookie, 'active', { httpOnly: true, sameSite: 'strict', path: '/api/v1/auth' })
  response.json({ success: true, data: { user: demoUser, accessToken: demoToken } })
})

app.post('/api/v1/auth/refresh', (request, response) => {
  if (request.cookies[demoCookie] !== 'active') {
    response.status(401).json({ success: false, error: { code: 'INVALID_REFRESH_TOKEN', message: 'La sesión no es válida o expiró.' } })
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
    response.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Debés iniciar sesión.' } })
    return
  }
  next()
})

app.get('/api/v1/auth/me', (_request, response) => response.json({ success: true, data: demoUser }))

app.get('/api/v1/products', (request, response) => {
  const search = String(request.query.search ?? '').toLocaleLowerCase('es')
  const items = products.filter((product) => product.name.toLocaleLowerCase('es').includes(search) || product.barcode.includes(search))
  response.json({ success: true, data: { items, pagination: { page: 1, pageSize: 20, total: items.length } } })
})

app.listen(port, () => {
  console.info(`API demo disponible en http://localhost:${port}`)
})
