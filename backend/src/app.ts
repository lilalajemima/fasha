import cors from 'cors'
import express from 'express'
import { env } from './core/config/env'
import { errorHandler, notFoundHandler } from './core/http/errorHandler'
import { accountRoutes } from './modules/accounts/accounts.routes'
import { adminRoutes } from './modules/admin/admin.routes'
import { applicationRoutes } from './modules/applications/application.routes'
import { authRoutes } from './modules/auth/auth.routes'
import { catalogueRoutes } from './modules/catalogue/catalogue.routes'
import { checkinRoutes } from './modules/checkin/checkin.routes'
import { healthRoutes } from './modules/health/health.routes'
import { notificationRoutes } from './modules/notifications/notification.routes'
import { opportunityRoutes } from './modules/opportunities/opportunity.routes'
import { portfolioRoutes } from './modules/portfolio/portfolio.routes'
import { profileRoutes } from './modules/profile/profile.routes'
import { submissionRoutes } from './modules/submissions/submission.routes'

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.clientOrigin, credentials: true }))
  // A brief is a PDF carried as base64, so the body can be a few megabytes.
  app.use(express.json({ limit: '4mb' }))

  app.use(healthRoutes)
  app.use(catalogueRoutes)
  app.use(authRoutes)
  app.use(accountRoutes)
  app.use(opportunityRoutes)
  app.use(profileRoutes)
  app.use(applicationRoutes)
  app.use(checkinRoutes)
  app.use(submissionRoutes)
  app.use(portfolioRoutes)
  app.use(notificationRoutes)
  app.use(adminRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
