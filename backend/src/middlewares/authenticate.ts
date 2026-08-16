import type { RequestHandler } from 'express'

import { AppError } from '../shared/errors/app-error.js'
import { verifyAccessToken } from '../modules/auth/auth.tokens.js'

export const authenticate: RequestHandler = (request, _response, next) => {
  const authorization = request.header('authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined

  if (!token) {
    next(new AppError(401, 'UNAUTHENTICATED', 'Debés iniciar sesión.'))
    return
  }

  try {
    request.auth = verifyAccessToken(token)
    next()
  } catch {
    next(new AppError(401, 'INVALID_ACCESS_TOKEN', 'La sesión no es válida o expiró.'))
  }
}
