import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { NotificationController } from './NotificationController'
import { NotificationRepository } from './NotificationRepository'
import { NotificationService } from './NotificationService'

const service = new NotificationService(new NotificationRepository())
const controller = new NotificationController(service)

export const notificationRoutes = Router()

notificationRoutes.get('/notifications', authenticate, controller.feed)
notificationRoutes.patch('/notifications/read-all', authenticate, controller.markAllRead)
notificationRoutes.patch('/notifications/:id/read', authenticate, controller.markRead)
