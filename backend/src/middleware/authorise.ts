import type { NextFunction, Request, Response } from 'express'
import { ForbiddenError, UnauthorisedError } from '../core/errors/HttpErrors'

export function authorise(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorisedError()
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError()
    }

    next()
  }
}
