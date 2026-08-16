import { createHash } from 'node:crypto'

import type { UserRole } from '@prisma/client'
import jwt, { type SignOptions } from 'jsonwebtoken'

import { env } from '../../config/env.js'

interface AuthPayload {
  userId: string
  role: UserRole
}

export function createAccessToken(payload: AuthPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as NonNullable<SignOptions['expiresIn']>,
    subject: payload.userId,
  })
}

export function createRefreshToken(payload: AuthPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.JWT_REFRESH_TTL_DAYS}d`,
    subject: payload.userId,
  })
}

export function verifyAccessToken(token: string): AuthPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as unknown as AuthPayload
}

export function verifyRefreshToken(token: string): AuthPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as unknown as AuthPayload
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
