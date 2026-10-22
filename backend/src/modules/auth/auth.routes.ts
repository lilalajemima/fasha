import { Router } from 'express'
import { passwordHasher, tokenService } from '../../core/container'
import { authenticate } from '../../middleware/authenticate'
import { AuthController } from './AuthController'
import { AuthService } from './AuthService'
import { UserRepository } from './UserRepository'

const authService = new AuthService(new UserRepository(), passwordHasher, tokenService)
const controller = new AuthController(authService)

export const authRoutes = Router()

authRoutes.post('/auth/register', controller.register)
authRoutes.post('/auth/login', controller.login)
authRoutes.get('/auth/me', authenticate, controller.me)
