import { Router } from 'express'
import { z } from 'zod'

import { asyncHandler } from '../../shared/http/async-handler.js'
import { sendSuccess } from '../../shared/http/response.js'
import { listUsersSchema, updateUserSchema } from './user.schema.js'
import { listUsers, updateUser } from './user.service.js'

const userIdSchema = z.uuid()

export const userRouter = Router()

userRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const { search } = listUsersSchema.parse(request.query)
    return sendSuccess(response, await listUsers(search))
  }),
)

userRouter.patch(
  '/:id',
  asyncHandler(async (request, response) => {
    const id = userIdSchema.parse(request.params.id)
    const input = updateUserSchema.parse(request.body)
    return sendSuccess(response, await updateUser(id, request.auth!.userId, input))
  }),
)
