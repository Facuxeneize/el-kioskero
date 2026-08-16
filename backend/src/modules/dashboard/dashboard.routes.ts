import { Router } from 'express'

import { asyncHandler } from '../../shared/http/async-handler.js'
import { sendSuccess } from '../../shared/http/response.js'
import { getDashboardSummary, getRecentSales, getTopProducts } from './dashboard.service.js'

export const dashboardRouter = Router()

dashboardRouter.get(
  '/summary',
  asyncHandler(async (_request, response) => sendSuccess(response, await getDashboardSummary())),
)

dashboardRouter.get(
  '/top-products',
  asyncHandler(async (_request, response) => sendSuccess(response, await getTopProducts())),
)

dashboardRouter.get(
  '/recent-sales',
  asyncHandler(async (_request, response) => sendSuccess(response, await getRecentSales())),
)
