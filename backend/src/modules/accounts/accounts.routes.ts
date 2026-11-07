import { Router } from 'express'
import { passwordHasher, tokenService } from '../../core/container'
import { authenticate } from '../../middleware/authenticate'
import { authorise } from '../../middleware/authorise'
import { AccountController } from './AccountController'
import { AccountRepository } from './AccountRepository'
import { AccountService } from './AccountService'
import { NotificationRepository } from '../notifications/NotificationRepository'
import { DatabaseNotifier } from '../notifications/Notifier'
import { UserAdminController } from './UserAdminController'
import { UserAdminService } from './UserAdminService'

const store = new AccountRepository()
const account = new AccountController(
  new AccountService(
    store,
    passwordHasher,
    new DatabaseNotifier(new NotificationRepository()),
    tokenService,
  ),
)
const users = new UserAdminController(new UserAdminService(store, passwordHasher))
const admins = authorise('ADMIN')

export const accountRoutes = Router()

accountRoutes.post('/account/forgotten', account.forgotten)

accountRoutes.post('/account/password', authenticate, account.changePassword)
accountRoutes.patch('/account/deactivate', authenticate, account.deactivate)
accountRoutes.post('/account/delete', authenticate, account.remove)

accountRoutes.get('/admin/users', authenticate, admins, users.list)
accountRoutes.patch('/admin/users/:id/status', authenticate, admins, users.setStatus)
accountRoutes.post('/admin/users/:id/password-reset', authenticate, admins, users.resetPassword)
accountRoutes.delete('/admin/users/:id', authenticate, admins, users.remove)
