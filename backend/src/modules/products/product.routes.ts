import { Router } from 'express'

import { asyncHandler } from '../../shared/http/async-handler.js'
import { sendSuccess } from '../../shared/http/response.js'
import {
  barcodeSchema,
  createProductSchema,
  productIdSchema,
  productListSchema,
  updateProductSchema,
} from './product.schema.js'
import {
  createProduct,
  deactivateProduct,
  getProduct,
  getProductByBarcode,
  listProducts,
  updateProduct,
} from './product.service.js'

export const productRouter = Router()

productRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const query = productListSchema.parse(request.query)
    return sendSuccess(response, await listProducts(query))
  }),
)

productRouter.get(
  '/barcode/:barcode',
  asyncHandler(async (request, response) => {
    const barcode = barcodeSchema.parse(request.params.barcode)
    return sendSuccess(response, await getProductByBarcode(barcode))
  }),
)

productRouter.get(
  '/:id',
  asyncHandler(async (request, response) => {
    const id = productIdSchema.parse(request.params.id)
    return sendSuccess(response, await getProduct(id))
  }),
)

productRouter.post(
  '/',
  asyncHandler(async (request, response) => {
    const input = createProductSchema.parse(request.body)
    return sendSuccess(response, await createProduct(input), 201)
  }),
)

productRouter.patch(
  '/:id',
  asyncHandler(async (request, response) => {
    const id = productIdSchema.parse(request.params.id)
    const input = updateProductSchema.parse(request.body)
    return sendSuccess(response, await updateProduct(id, input))
  }),
)

productRouter.delete(
  '/:id',
  asyncHandler(async (request, response) => {
    const id = productIdSchema.parse(request.params.id)
    return sendSuccess(response, await deactivateProduct(id))
  }),
)
