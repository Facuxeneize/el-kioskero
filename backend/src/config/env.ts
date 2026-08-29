import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(7),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  ADMIN_NAME: z.string().min(1).default('Administrador'),
  ADMIN_USERNAME: z.string().min(3).max(60).default('admin'),
  ADMIN_EMAIL: z.email().default('admin@kiosko.local'),
  ADMIN_KIOSK_NAME: z.string().min(1).max(160).default('El Kioskero'),
  ADMIN_PASSWORD: z.string().optional(),
  SECONDARY_USER_NAME: z.string().min(1).optional(),
  SECONDARY_USER_USERNAME: z.string().min(3).max(60).optional(),
  SECONDARY_USER_EMAIL: z.email().optional(),
  SECONDARY_USER_KIOSK_NAME: z.string().min(1).max(160).optional(),
  SECONDARY_USER_PASSWORD: z.string().min(8).optional(),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Variables de entorno inválidas:', z.treeifyError(result.error))
  throw new Error('La configuración del servidor es inválida.')
}

export const env = result.data
