import jwt from 'jsonwebtoken'
import { describe, expect, it } from 'vitest'
import { TokenService } from './TokenService'
import { UnauthorisedError } from '../errors/HttpErrors'

const SECRET = 'test-secret-value'
const tokens = new TokenService(SECRET, '1h')

describe('TokenService', () => {
  it('returns the same payload it was given', () => {
    const token = tokens.issue({ userId: 'user-1', role: 'VOLUNTEER', tokenVersion: 3 })

    expect(tokens.verify(token)).toEqual({
      userId: 'user-1',
      role: 'VOLUNTEER',
      tokenVersion: 3,
    })
  })

  it('reads a token with no version as version zero', () => {
    const old = jwt.sign({ userId: 'user-1', role: 'VOLUNTEER' }, SECRET, { expiresIn: '1h' })

    expect(tokens.verify(old).tokenVersion).toBe(0)
  })

  it('rejects a token signed with a different secret', () => {
    const otherService = new TokenService('a-different-secret', '1h')
    const token = otherService.issue({ userId: 'user-1', role: 'VOLUNTEER' })

    expect(() => tokens.verify(token)).toThrow(UnauthorisedError)
  })

  it('rejects a token that has been tampered with', () => {
    const token = tokens.issue({ userId: 'user-1', role: 'VOLUNTEER' })

    expect(() => tokens.verify(`${token}x`)).toThrow(UnauthorisedError)
  })
})
