import { UserStatus, type User } from '@prisma/client'
import type { NextFunction, Request, Response } from 'express'
import { ForbiddenError, UnauthorisedError } from '../core/errors/HttpErrors'
import type { TokenService } from '../core/security/TokenService'

const BEARER_PREFIX = 'Bearer '

// Only what the check reads, so a test can hand in a list of accounts instead
// of the database.
export type AccountLookup = {
  findById(id: string): Promise<Pick<User, 'status' | 'tokenVersion'> | null>
}

/**
 * A token lasts seven days and a decision about an account should not wait
 * that long, so the account is read on every request rather than trusted from
 * the token alone. Deactivating somebody takes effect on their next request.
 */
export function authenticateWith(accounts: AccountLookup, tokens: TokenService) {
  return async function authenticate(req: Request, _res: Response, next: NextFunction) {
    const header = req.headers.authorization

    if (!header || !header.startsWith(BEARER_PREFIX)) {
      throw new UnauthorisedError()
    }

    const payload = tokens.verify(header.slice(BEARER_PREFIX.length))
    const user = await accounts.findById(payload.userId)

    if (!user || user.status === UserStatus.DELETED) {
      throw new UnauthorisedError()
    }

    if (user.status === UserStatus.DEACTIVATED) {
      throw new ForbiddenError('This account is deactivated')
    }

    // Changing a password moves the account's version on, which leaves every
    // token handed out before it behind. The device that made the change is
    // given a replacement; the others are not.
    if ((payload.tokenVersion ?? 0) !== user.tokenVersion) {
      throw new UnauthorisedError('Your password was changed. Sign in again.')
    }

    req.user = payload
    next()
  }
}
