import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { authorise } from '../../middleware/authorise'
import { UserRepository } from '../auth/UserRepository'
import { MatchingService } from '../matching/MatchingService'
import { OpportunityController } from './OpportunityController'
import { OpportunityRepository } from './OpportunityRepository'
import { OpportunityService } from './OpportunityService'

const service = new OpportunityService(
  new OpportunityRepository(),
  new UserRepository(),
  new MatchingService(),
)

const controller = new OpportunityController(service)
const approvers = authorise('ORGANISATION', 'ADMIN')

export const opportunityRoutes = Router()

opportunityRoutes.use('/opportunities', authenticate)

opportunityRoutes.get('/opportunities', controller.feed)
opportunityRoutes.post('/opportunities', controller.create)
opportunityRoutes.get('/opportunities/mine', controller.mine)
opportunityRoutes.get('/opportunities/pending', approvers, controller.awaitingApproval)
opportunityRoutes.get('/opportunities/:id', controller.detail)
opportunityRoutes.patch('/opportunities/:id/status', approvers, controller.decide)
