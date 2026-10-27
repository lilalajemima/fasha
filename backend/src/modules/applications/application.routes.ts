import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { OpportunityRepository } from '../opportunities/OpportunityRepository'
import { ApplicationController } from './ApplicationController'
import { ApplicationRepository } from './ApplicationRepository'
import { ApplicationService } from './ApplicationService'

const service = new ApplicationService(new ApplicationRepository(), new OpportunityRepository())
const controller = new ApplicationController(service)

export const applicationRoutes = Router()

applicationRoutes.get('/applications/mine', authenticate, controller.mine)
applicationRoutes.patch('/applications/:id/status', authenticate, controller.decide)
applicationRoutes.patch('/applications/:id/withdraw', authenticate, controller.withdraw)
applicationRoutes.post('/opportunities/:id/applications', authenticate, controller.apply)
applicationRoutes.get('/opportunities/:id/applications', authenticate, controller.forOpportunity)
