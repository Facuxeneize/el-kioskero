import { Router } from 'express'

import { asyncHandler } from '../../shared/http/async-handler.js'
import { sendSuccess } from '../../shared/http/response.js'
import { productIdSchema } from '../products/product.schema.js'
import { stockAdjustmentSchema, stockInSchema, stockMovementListSchema } from './stock.schema.js'
import { addStock, adjustStock, listStockMovements } from './stock.service.js'

export const stockRouter = Router()

stockRouter.get(
  '/movements',
  asyncHandler(async (request, response) => {
    const input = stockMovementListSchema.parse(request.query)
    return sendSuccess(response, await listStockMovements({ ...input, userId: request.auth!.userId }))
  }),
)

export const productStockRouter = Router({ mergeParams: true })

productStockRouter.get(
  '/movements',
  asyncHandler(async (request, response) => {
    const productId = productIdSchema.parse(request.params.id)
    const input = stockMovementListSchema.omit({ productId: true }).parse(request.query)
    return sendSuccess(response, await listStockMovements({ ...input, productId, userId: request.auth!.userId }))
  }),
)

productStockRouter.post(
  '/in',
  asyncHandler(async (request, response) => {
    const productId = productIdSchema.parse(request.params.id)
    const input = stockInSchema.parse(request.body)
    return sendSuccess(
      response,
      await addStock(productId, request.auth!.userId, input.quantity, input.notes),
      201,
    )
  }),
)

productStockRouter.post(
  '/adjustment',
  asyncHandler(async (request, response) => {
    const productId = productIdSchema.parse(request.params.id)
    const input = stockAdjustmentSchema.parse(request.body)
    return sendSuccess(
      response,
      await adjustStock(productId, request.auth!.userId, input.actualStock, input.notes),
      201,
    )
  }),
)
