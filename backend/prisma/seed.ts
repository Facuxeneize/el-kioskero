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
      passwordHash,
      isActive: true,
    },
    create: {
      name: env.ADMIN_NAME,
      email: env.ADMIN_EMAIL.toLowerCase(),
      passwordHash,
    },
  })

  console.info(`Administrador preparado: ${env.ADMIN_EMAIL}`)
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
