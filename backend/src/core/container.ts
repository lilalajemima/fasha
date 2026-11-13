import { env } from './config/env'
import { GoogleVerifier } from './security/GoogleVerifier'
import { PasswordHasher } from './security/PasswordHasher'
import { TokenService } from './security/TokenService'

export const passwordHasher = new PasswordHasher()
export const tokenService = new TokenService(env.jwtSecret, env.jwtExpiresIn)
export const googleVerifier = new GoogleVerifier(env.googleClientId)
