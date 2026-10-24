import { Router } from 'express'
import { prisma } from '../../core/database/prisma'

export const healthRoutes = Router()

healthRoutes.get('/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`
  res.json({ status: 'ok', time: new Date().toISOString() })
})
