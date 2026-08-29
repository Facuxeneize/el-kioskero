import { Router } from 'express'
import rateLimit from 'express-rate-limit'

import { env } from '../../config/env.js'
import { authenticate } from '../../middlewares/authenticate.js'
import { asyncHandler } from '../../shared/http/async-handler.js'
import { sendSuccess } from '../../shared/http/response.js'
import { loginSchema, registerSchema } from './auth.schema.js'
import { getCurrentUser, login, logout, refreshSession, registerUser } from './auth.service.js'

const refreshCookie = 'kiosko_refresh'
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: env.JWT_REFRESH_TTL_DAYS * 86_400_000,
}

export const authRouter = Router()

authRouter.post(
  '/register',
  rateLimit({ windowMs: 60 * 60_000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false }),
  asyncHandler(async (request, response) => {
    const input = registerSchema.parse(request.body)
    const { refreshToken, ...result } = await registerUser(input)
    response.cookie(refreshCookie, refreshToken, cookieOptions)
    return sendSuccess(response, result, 201)
  }),
)

authRouter.post(
  '/login',
  rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false }),
  asyncHandler(async (request, response) => {
    const input = loginSchema.parse(request.body)
    const { refreshToken, ...result } = await login(input.email, input.password)
    response.cookie(refreshCookie, refreshToken, cookieOptions)
    return sendSuccess(response, result)
  }),
)

authRouter.post(
  '/refresh',
  asyncHandler(async (request, response) => {
    const currentToken = request.cookies[refreshCookie] as string | undefined
    const { accessToken, refreshToken } = await refreshSession(currentToken ?? '')
    response.cookie(refreshCookie, refreshToken, cookieOptions)
    return sendSuccess(response, { accessToken })
  }),
)

authRouter.post(
  '/logout',
  asyncHandler(async (request, response) => {
    await logout(request.cookies[refreshCookie] as string | undefined)
    response.clearCookie(refreshCookie, cookieOptions)
    return sendSuccess(response, null)
  }),
)

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (request, response) => sendSuccess(response, await getCurrentUser(request.auth!.userId))),
)
