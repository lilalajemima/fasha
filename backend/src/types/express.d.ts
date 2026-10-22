import type { TokenPayload } from '../core/security/TokenService'

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export {}
