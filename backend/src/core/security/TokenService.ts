import jwt, { type SignOptions } from 'jsonwebtoken'
import { UnauthorisedError } from '../errors/HttpErrors'

export type TokenPayload = {
  userId: string
  role: string
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
      return { userId: decoded.userId, role: decoded.role }
    } catch {
      throw new UnauthorisedError('Your session has expired. Sign in again.')
    }
  }
}
