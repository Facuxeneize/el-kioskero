import { z } from 'zod'

export const listUsersSchema = z.object({
  search: z.string().trim().max(190).default(''),
})

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  kioskName: z.string().trim().min(2).max(160).optional(),
  username: z.string().trim().min(3).max(60).regex(/^[a-zA-Z0-9._-]+$/).transform((value) => value.toLowerCase()).optional(),
  email: z.email().trim().max(190).transform((value) => value.toLowerCase()).optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(12).max(128).optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'Debés enviar al menos un cambio.' })
