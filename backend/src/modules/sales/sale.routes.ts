import { Router } from 'express'

import { asyncHandler } from '../../shared/http/async-handler.js'
import { sendSuccess } from '../../shared/http/response.js'
import { createSaleSchema, idempotencyKeySchema, saleIdSchema, saleListSchema } from './sale.schema.js'
import { createSale, getSale, listSales, voidSale } from './sale.service.js'

export const saleRouter = Router()

saleRouter.post(
  '/',
  asyncHandler(async (request, response) => {
    const input = createSaleSchema.parse(request.body)
    const idempotencyKey = idempotencyKeySchema.parse(request.header('idempotency-key'))
    return sendSuccess(response, await createSale(request.auth!.userId, input.items, idempotencyKey), 201)
  }),
)

saleRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const input = saleListSchema.parse(request.query)
    return sendSuccess(response, await listSales({ ...input, userId: request.auth!.userId }))
  }),
)

saleRouter.get(
  '/:id',
  asyncHandler(async (request, response) => {
    const id = saleIdSchema.parse(request.params.id)
    return sendSuccess(response, await getSale(id, request.auth!.userId))
  }),
)

saleRouter.post(
  '/:id/void',
  asyncHandler(async (request, response) => {
    const id = saleIdSchema.parse(request.params.id)
    return sendSuccess(response, await voidSale(id, request.auth!.userId))
  }),
)
