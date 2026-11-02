import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { authorise } from '../../middleware/authorise'
import { AdminController } from './AdminController'
import { AdminRepository } from './AdminRepository'
import { AdminService } from './AdminService'

const service = new AdminService(new AdminRepository())
const controller = new AdminController(service)
const admins = authorise('ADMIN')

export const adminRoutes = Router()

adminRoutes.get('/admin/summary', authenticate, admins, controller.summary)
adminRoutes.get('/admin/activity', authenticate, admins, controller.activity)
adminRoutes.get('/admin/attendance.csv', authenticate, admins, controller.attendanceCsv)
