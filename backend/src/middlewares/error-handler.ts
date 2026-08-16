import { Prisma } from '@prisma/client'
import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'

import { logger } from '../config/logger.js'
import { AppError } from '../shared/errors/app-error.js'

export const errorHandler: ErrorRequestHandler = (error: unknown, request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son válidos.',
        details: error.flatten(),
      },
    })
    return
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      error: { code: error.code, message: error.message, details: error.details },
    })
    return
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    response.status(409).json({
      success: false,
      error: { code: 'RESOURCE_ALREADY_EXISTS', message: 'Ya existe un registro con esos datos.' },
    })
    return
  }

  logger.error({ error, method: request.method, path: request.path }, 'Error no controlado')
  response.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado.' },
  })
}
