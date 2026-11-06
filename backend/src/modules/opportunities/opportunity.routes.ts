import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { authorise } from '../../middleware/authorise'
import { UserRepository } from '../auth/UserRepository'
import { MatchingService } from '../matching/MatchingService'
import { NotificationRepository } from '../notifications/NotificationRepository'
import { DatabaseNotifier } from '../notifications/Notifier'
import { OpportunityController } from './OpportunityController'
import { OpportunityRepository } from './OpportunityRepository'
import { OpportunityService } from './OpportunityService'

const service = new OpportunityService(
  new OpportunityRepository(),
  new UserRepository(),
  new MatchingService(),
  new DatabaseNotifier(new NotificationRepository()),
)

const controller = new OpportunityController(service)
const reviewers = authorise('ADMIN')

export const opportunityRoutes = Router()

opportunityRoutes.get('/opportunities', authenticate, controller.feed)
opportunityRoutes.post('/opportunities', authenticate, controller.create)
opportunityRoutes.get('/opportunities/mine', authenticate, controller.mine)
opportunityRoutes.get('/opportunities/mine/workload', authenticate, controller.workload)
opportunityRoutes.get('/opportunities/pending', authenticate, reviewers, controller.awaitingApproval)
opportunityRoutes.get('/opportunities/all', authenticate, reviewers, controller.everything)
opportunityRoutes.get('/opportunities/:id', authenticate, controller.detail)
// Public: a portfolio is public, and the briefs on it have to open from it.
opportunityRoutes.get('/opportunities/:id/brief', controller.brief)
opportunityRoutes.patch('/opportunities/:id/status', authenticate, reviewers, controller.decide)
opportunityRoutes.patch('/opportunities/:id', authenticate, controller.update)
opportunityRoutes.patch('/opportunities/:id/close', authenticate, controller.close)
opportunityRoutes.delete('/opportunities/:id', authenticate, controller.remove)
