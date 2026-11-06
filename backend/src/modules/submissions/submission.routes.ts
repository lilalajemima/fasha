import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { ApplicationRepository } from '../applications/ApplicationRepository'
import { NotificationRepository } from '../notifications/NotificationRepository'
import { DatabaseNotifier } from '../notifications/Notifier'
import { OpportunityRepository } from '../opportunities/OpportunityRepository'
import { SubmissionController } from './SubmissionController'
import { SubmissionRepository } from './SubmissionRepository'
import { SubmissionService } from './SubmissionService'

const service = new SubmissionService(
  new SubmissionRepository(),
  new ApplicationRepository(),
  new OpportunityRepository(),
  new DatabaseNotifier(new NotificationRepository()),
)
const controller = new SubmissionController(service)

export const submissionRoutes = Router()

submissionRoutes.get('/submissions/mine', authenticate, controller.mine)
submissionRoutes.get('/submissions/received', authenticate, controller.received)
submissionRoutes.patch('/submissions/:id/status', authenticate, controller.decide)
submissionRoutes.post('/opportunities/:id/submissions', authenticate, controller.submit)
submissionRoutes.get('/opportunities/:id/submissions', authenticate, controller.forOpportunity)
