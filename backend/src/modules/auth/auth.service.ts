import bcrypt from 'bcrypt'

import { env } from '../../config/env.js'
import { prisma } from '../../config/database.js'
import { AppError } from '../../shared/errors/app-error.js'
import { createAccessToken, createRefreshToken, hashToken, verifyRefreshToken } from './auth.tokens.js'

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  lastLoginAt: true,
} as const

async function persistSession(user: { id: string; role: 'ADMIN' }) {
  const payload = { userId: user.id, role: user.role }
  const refreshToken = createRefreshToken(payload)

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 86_400_000),
    },
  })

  return { accessToken: createAccessToken(payload), refreshToken }
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false

  if (!user || !user.isActive || !passwordMatches) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email o contraseña incorrectos.')
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
    select: publicUserSelect,
  })
  const tokens = await persistSession(user)

  return { user: updatedUser, ...tokens }
}

export async function refreshSession(currentToken: string) {
  let payload: ReturnType<typeof verifyRefreshToken>
  try {
    payload = verifyRefreshToken(currentToken)
  } catch {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'La sesión no es válida o expiró.')
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(currentToken) },
    include: { user: true },
  })

  if (
    !storedToken ||
    storedToken.revokedAt ||
    storedToken.expiresAt <= new Date() ||
    !storedToken.user.isActive ||
    storedToken.userId !== payload.userId
  ) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'La sesión no es válida o expiró.')
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  })

  return persistSession(storedToken.user)
}

export async function logout(currentToken?: string) {
  if (!currentToken) return

  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(currentToken), revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: publicUserSelect,
  })
  if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'Debés iniciar sesión.')
  return user
}
