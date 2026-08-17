import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().min(1).max(190).transform((value) => value.toLowerCase()),
  password: z.string().min(1),
})
