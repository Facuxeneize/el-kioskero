import type { RequestHandler } from 'express'

import { AppError } from '../shared/errors/app-error.js'

export const requireAdmin: RequestHandler = (request, _response, next) => {
  if (request.auth?.role !== 'ADMIN') {
    next(new AppError(403, 'FORBIDDEN', 'No tenés permisos para realizar esta acción.'))
    return
  }

  next()
}
