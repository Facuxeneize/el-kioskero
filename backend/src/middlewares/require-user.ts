import type { RequestHandler } from 'express'

import { AppError } from '../shared/errors/app-error.js'

export const requireUser: RequestHandler = (request, _response, next) => {
  if (request.auth?.role !== 'USER') {
    next(new AppError(403, 'FORBIDDEN', 'Esta sección está disponible únicamente para usuarios de kioscos.'))
    return
  }

  next()
}
