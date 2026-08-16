import { z } from 'zod'

export const saleIdSchema = z.uuid()

export const createSaleSchema = z.object({
  items: z.array(z.object({
    productId: z.uuid(),
    quantity: z.number().int().positive(),
  })).min(1).max(200),
})

export const idempotencyKeySchema = z.string().trim().min(8).max(100).optional()

export const saleListSchema = z.object({
  status: z.enum(['COMPLETED', 'VOIDED']).optional(),
  dateFrom: z.iso.date().optional(),
  dateTo: z.iso.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
}).refine((input) => !input.dateFrom || !input.dateTo || input.dateFrom <= input.dateTo, {
  message: 'La fecha desde no puede ser posterior a la fecha hasta.',
  path: ['dateFrom'],
})
