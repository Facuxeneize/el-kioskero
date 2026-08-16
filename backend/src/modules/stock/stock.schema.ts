import { z } from 'zod'

export const stockInSchema = z.object({
  quantity: z.number().int().positive(),
  notes: z.string().trim().max(500).optional(),
})

export const stockAdjustmentSchema = z.object({
  actualStock: z.number().int().nonnegative(),
  notes: z.string().trim().min(1).max(500),
})

export const stockMovementListSchema = z.object({
  productId: z.uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
})
