import type { NextFunction, Request, Response } from 'express'
import { tokenService } from '../core/container'
import { UnauthorisedError } from '../core/errors/HttpErrors'

const BEARER_PREFIX = 'Bearer '

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    throw new UnauthorisedError()
  }

  req.user = tokenService.verify(header.slice(BEARER_PREFIX.length))
  next()
}
