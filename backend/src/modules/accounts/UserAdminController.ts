import type { Request, Response } from 'express'
import { routeParam } from '../../core/http/params'
import { readStatus } from '../../core/validation/readers'
import type { UserFilter } from './AccountStore'
import type { UserAdminService } from './UserAdminService'

const ROLES = ['VOLUNTEER', 'ORGANISATION', 'ADMIN']
const STATUSES = ['ACTIVE', 'DEACTIVATED', 'DELETED']

export class UserAdminController {
  constructor(private readonly users: UserAdminService) {}

  list = async (req: Request, res: Response) => {
    res.json(await this.users.list(this.filterFrom(req)))
  }

  setStatus = async (req: Request, res: Response) => {
    const view = await this.users.setStatus(req.user!, routeParam(req, 'id'), readStatus(req.body))

    res.json(view)
  }

  resetPassword = async (req: Request, res: Response) => {
    res.json(await this.users.issueTemporaryPassword(req.user!, routeParam(req, 'id')))
  }

  remove = async (req: Request, res: Response) => {
    await this.users.remove(req.user!, routeParam(req, 'id'))

    res.status(204).send()
  }

  private filterFrom(req: Request): UserFilter {
    const search = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    const role = typeof req.query.role === 'string' ? req.query.role.toUpperCase() : ''
    const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : ''

    return {
      search: search.length > 0 ? search : null,
      role: ROLES.includes(role) ? (role as UserFilter['role']) : null,
      status: STATUSES.includes(status) ? (status as UserFilter['status']) : null,
    }
  }
}
