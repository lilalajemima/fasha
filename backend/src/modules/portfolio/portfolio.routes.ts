import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { ProfileRepository } from '../profile/ProfileRepository'
import { PortfolioController } from './PortfolioController'
import { PortfolioRepository } from './PortfolioRepository'
import { PortfolioService } from './PortfolioService'

const service = new PortfolioService(new PortfolioRepository(), new ProfileRepository())
const controller = new PortfolioController(service)

export const portfolioRoutes = Router()

portfolioRoutes.get('/portfolio/mine', authenticate, controller.mine)
portfolioRoutes.get('/p/:slug', controller.public)
