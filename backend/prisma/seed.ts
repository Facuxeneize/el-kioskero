import bcrypt from 'bcrypt'

import { prisma } from '../src/config/database.js'
import { env } from '../src/config/env.js'

async function main() {
  if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 12) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres para ejecutar el seed.')
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12)

  await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL.toLowerCase() },
    update: {
      name: env.ADMIN_NAME,
      username: env.ADMIN_USERNAME.toLowerCase(),
      kioskName: env.ADMIN_KIOSK_NAME,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      name: env.ADMIN_NAME,
      username: env.ADMIN_USERNAME.toLowerCase(),
      email: env.ADMIN_EMAIL.toLowerCase(),
      kioskName: env.ADMIN_KIOSK_NAME,
      passwordHash,
      role: 'ADMIN',
    },
  })

  console.info(`Administrador preparado: ${env.ADMIN_EMAIL}`)

  const secondaryValues = [
    env.SECONDARY_USER_NAME,
    env.SECONDARY_USER_USERNAME,
    env.SECONDARY_USER_EMAIL,
    env.SECONDARY_USER_KIOSK_NAME,
    env.SECONDARY_USER_PASSWORD,
  ]
  const hasSecondaryUser = secondaryValues.some(Boolean)

  if (hasSecondaryUser && secondaryValues.some((value) => !value)) {
    throw new Error('Para crear el usuario adicional deben completarse todas las variables SECONDARY_USER_*.')
  }

  if (hasSecondaryUser) {
    const username = env.SECONDARY_USER_USERNAME!.toLowerCase()
    const email = env.SECONDARY_USER_EMAIL!.toLowerCase()
    const secondaryPasswordHash = await bcrypt.hash(env.SECONDARY_USER_PASSWORD!, 12)

    await prisma.user.upsert({
      where: { username },
      update: {
        name: env.SECONDARY_USER_NAME!,
        email,
        kioskName: env.SECONDARY_USER_KIOSK_NAME!,
        passwordHash: secondaryPasswordHash,
        role: 'USER',
        isActive: true,
      },
      create: {
        name: env.SECONDARY_USER_NAME!,
        username,
        kioskName: env.SECONDARY_USER_KIOSK_NAME!,
        email,
        passwordHash: secondaryPasswordHash,
        role: 'USER',
      },
    })

    console.info(`Usuario adicional preparado: ${username}`)
  }
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
