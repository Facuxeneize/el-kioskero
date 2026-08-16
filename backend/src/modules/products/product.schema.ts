import { z } from 'zod'

const moneySchema = z.union([z.string(), z.number()]).transform((value) => String(value))

export const productIdSchema = z.uuid()
export const barcodeSchema = z.string().trim().min(1).max(64)

export const createProductSchema = z.object({
  barcode: barcodeSchema,
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).nullable().optional(),
  salePrice: moneySchema.refine((value) => /^\d{1,10}(\.\d{1,2})?$/.test(value) && Number(value) >= 0, {
    message: 'El precio debe ser un importe positivo con hasta dos decimales.',
  }),
  minimumStock: z.number().int().nonnegative(),
})

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export const productListSchema = z.object({
  search: z.string().trim().max(160).optional(),
  active: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
