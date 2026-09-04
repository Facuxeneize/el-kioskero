import type { Prisma } from '@prisma/client'
import bcrypt from 'bcrypt'

import { prisma } from '../../config/database.js'
import { AppError } from '../../shared/errors/app-error.js'

const userSelect = {
  id: true,
  name: true,
  kioskName: true,
  username: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const

export async function listUsers(search: string) {
  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { name: { contains: search } },
          { kioskName: { contains: search } },
          { username: { contains: search } },
          { email: { contains: search } },
        ],
      }
    : {}

  return prisma.user.findMany({ where, select: userSelect, orderBy: { createdAt: 'desc' } })
}

export async function updateUser(
  id: string,
  actorId: string,
  data: Prisma.UserUpdateInput & { role?: 'ADMIN' | 'USER'; isActive?: boolean; password?: string },
) {
  const current = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!current) throw new AppError(404, 'USER_NOT_FOUND', 'El usuario no existe.')

  if (id === actorId && (data.role === 'USER' || data.isActive === false)) {
    throw new AppError(400, 'SELF_ADMIN_LOCKOUT', 'No podés quitarte el rol de administrador ni desactivar tu propia cuenta.')
  }

  const { password, ...userData } = data
  const passwordHash = password ? await bcrypt.hash(password, 12) : undefined

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.user.update({
      where: { id },
      data: { ...userData, ...(passwordHash ? { passwordHash } : {}) },
      select: userSelect,
    })

    if (passwordHash) {
      await transaction.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      })
    }

    return updated
  })
}
