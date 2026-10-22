import { describe, expect, it } from 'vitest'
import { TokenService } from './TokenService'
import { UnauthorisedError } from '../errors/HttpErrors'

const tokens = new TokenService('test-secret-value', '1h')

describe('TokenService', () => {
  it('returns the same payload it was given', () => {
    const token = tokens.issue({ userId: 'user-1', role: 'VOLUNTEER' })

    expect(tokens.verify(token)).toEqual({ userId: 'user-1', role: 'VOLUNTEER' })
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
