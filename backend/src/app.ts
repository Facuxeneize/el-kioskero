import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'

import { prisma } from './config/database.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { authenticate } from './middlewares/authenticate.js'
import { errorHandler } from './middlewares/error-handler.js'
import { notFound } from './middlewares/not-found.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js'
import { productRouter } from './modules/products/product.routes.js'
import { saleRouter } from './modules/sales/sale.routes.js'
import { productStockRouter, stockRouter } from './modules/stock/stock.routes.js'
import { asyncHandler } from './shared/http/async-handler.js'
import { sendSuccess } from './shared/http/response.js'

export const app = express()

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
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
app.use('/api/v1/products', authenticate, productRouter)
app.use('/api/v1/products/:id/stock', authenticate, productStockRouter)
app.use('/api/v1/stock', authenticate, stockRouter)
app.use('/api/v1/sales', authenticate, saleRouter)
app.use('/api/v1/dashboard', authenticate, dashboardRouter)

app.use(notFound)
app.use(errorHandler)
