import { Router } from 'express'

import { asyncHandler } from '../../shared/http/async-handler.js'
import { sendSuccess } from '../../shared/http/response.js'
import { getDashboardSummary, getRecentSales, getTopProducts } from './dashboard.service.js'

export const dashboardRouter = Router()

dashboardRouter.get(
  '/summary',
  asyncHandler(async (request, response) => sendSuccess(response, await getDashboardSummary(request.auth!.userId))),
)

dashboardRouter.get(
  '/top-products',
  asyncHandler(async (request, response) => sendSuccess(response, await getTopProducts(request.auth!.userId))),
)

dashboardRouter.get(
  '/recent-sales',
  asyncHandler(async (request, response) => sendSuccess(response, await getRecentSales(request.auth!.userId))),
)
