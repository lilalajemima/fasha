import jwt, { type SignOptions } from 'jsonwebtoken'
import { UnauthorisedError } from '../errors/HttpErrors'

/**
 * Signing in hands out a token rather than keeping a session on the server,
 * which is what lets the API run as a function with nothing held in memory
 * between requests. The cost is that a token cannot be taken back, only
 * outlived, so seven days is the longest anybody stays signed in and the
 * version inside it is how a password change ends the sessions still running.
 */
export type TokenPayload = {
  userId: string
  role: string
  // Read in authenticate and nowhere else. Optional because a service is
  // handed an actor and only ever reads who it is; it has no business knowing
  // which generation of token brought them in.
  tokenVersion?: number
}

export class TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {}

  issue(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn } as SignOptions)
  }

  verify(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret) as TokenPayload

      // A token signed before versioning existed has no version. Reading it
      // as zero matches an account whose password has not changed since, so
      // adding this does not sign the whole pilot out at once.
      return {
        userId: decoded.userId,
        role: decoded.role,
        tokenVersion: decoded.tokenVersion ?? 0,
      }
    } catch {
      throw new UnauthorisedError('Your session has expired. Sign in again.')
    }
  }
}
