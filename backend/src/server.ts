import { createServer } from 'node:http'

import { app } from './app.js'
import { prisma } from './config/database.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'

const server = createServer(app)

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'API de El Kioskero iniciada')
})

async function shutdown(signal: string) {
  logger.info({ signal }, 'Cerrando servidor')
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
