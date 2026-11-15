import { tokenService } from '../core/container'
import { AccountRepository } from '../modules/accounts/AccountRepository'
import { authenticateWith } from './authenticateWith'

export const authenticate = authenticateWith(new AccountRepository(), tokenService)
