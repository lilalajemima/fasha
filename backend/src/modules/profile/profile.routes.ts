import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { UserRepository } from '../auth/UserRepository'
import { ProfileController } from './ProfileController'
import { ProfileRepository } from './ProfileRepository'
import { ProfileService } from './ProfileService'

const service = new ProfileService(new UserRepository(), new ProfileRepository())
const controller = new ProfileController(service)

export const profileRoutes = Router()

profileRoutes.patch('/profile', authenticate, controller.update)
