import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().min(1).max(190).transform((value) => value.toLowerCase()),
  password: z.string().min(1),
})

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  kioskName: z.string().trim().min(2).max(160),
  username: z.string().trim().min(3).max(60).regex(/^[a-zA-Z0-9._-]+$/).transform((value) => value.toLowerCase()),
  email: z.email().trim().max(190).transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
})
