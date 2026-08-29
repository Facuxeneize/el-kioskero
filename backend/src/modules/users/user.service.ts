import type { Prisma } from '@prisma/client'

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
  data: Prisma.UserUpdateInput & { role?: 'ADMIN' | 'USER'; isActive?: boolean },
) {
  const current = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!current) throw new AppError(404, 'USER_NOT_FOUND', 'El usuario no existe.')

  if (id === actorId && (data.role === 'USER' || data.isActive === false)) {
    throw new AppError(400, 'SELF_ADMIN_LOCKOUT', 'No podés quitarte el rol de administrador ni desactivar tu propia cuenta.')
  }

  return prisma.user.update({ where: { id }, data, select: userSelect })
}
