import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'

import { prisma } from './config/database.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { authenticate } from './middlewares/authenticate.js'
import { requireAdmin } from './middlewares/require-admin.js'
import { requireUser } from './middlewares/require-user.js'
import { errorHandler } from './middlewares/error-handler.js'
import { notFound } from './middlewares/not-found.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js'
import { productRouter } from './modules/products/product.routes.js'
import { saleRouter } from './modules/sales/sale.routes.js'
import { productStockRouter, stockRouter } from './modules/stock/stock.routes.js'
import { userRouter } from './modules/users/user.routes.js'
import { asyncHandler } from './shared/http/async-handler.js'
import { sendSuccess } from './shared/http/response.js'

export const app = express()

const allowedOrigins = new Set([env.CORS_ORIGIN])
if (env.NODE_ENV === 'development') {
  allowedOrigins.add('http://localhost:5173')
  allowedOrigins.add('http://127.0.0.1:5173')
}

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
  credentials: true,
}))
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())
app.use(pinoHttp({ logger }))

app.get(
  '/health',
  asyncHandler(async (_request, response) => {
    await prisma.$queryRaw`SELECT 1`
    return sendSuccess(response, { status: 'ok', timestamp: new Date().toISOString() })
  }),
)

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/products', authenticate, requireUser, productRouter)
app.use('/api/v1/products/:id/stock', authenticate, requireUser, productStockRouter)
app.use('/api/v1/stock', authenticate, requireUser, stockRouter)
app.use('/api/v1/sales', authenticate, requireUser, saleRouter)
app.use('/api/v1/dashboard', authenticate, requireUser, dashboardRouter)
app.use('/api/v1/users', authenticate, requireAdmin, userRouter)

app.use(notFound)
app.use(errorHandler)
