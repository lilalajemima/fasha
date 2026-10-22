import { env } from './core/config/env'
import { prisma } from './core/database/prisma'
import { createApp } from './app'

const server = createApp().listen(env.port, () => {
  console.log(`Fasha API listening on http://localhost:${env.port}`)
})

async function shutDown() {
  server.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', shutDown)
process.on('SIGTERM', shutDown)
