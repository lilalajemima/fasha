import cors from 'cors'
import express from 'express'
import { env } from './core/config/env'
import { errorHandler, notFoundHandler } from './core/http/errorHandler'
import { authRoutes } from './modules/auth/auth.routes'
import { healthRoutes } from './modules/health/health.routes'

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.clientOrigin, credentials: true }))
  app.use(express.json({ limit: '1mb' }))

  app.use(healthRoutes)
  app.use(authRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
