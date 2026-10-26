import { describe, expect, it } from 'vitest'
import { TotpService } from './TotpService'

const totp = new TotpService()
const secret = totp.createSecret()
const noon = new Date('2026-11-14T12:00:00.000Z')

function secondsFrom(at: Date, seconds: number): Date {
  return new Date(at.getTime() + seconds * 1000)
}

describe('TotpService', () => {
  it('produces a six digit code', () => {
    expect(totp.generate(secret, noon)).toMatch(/^\d{6}$/)
  })

  it('accepts the code it just produced', () => {
    const code = totp.generate(secret, noon)

    expect(totp.verify(secret, code, noon)).toBe(true)
  })

  it('still accepts a code from the step before, for a slow scan', () => {
    const code = totp.generate(secret, noon)

    expect(totp.verify(secret, code, secondsFrom(noon, 30))).toBe(true)
  })

  it('rejects a code from two minutes ago', () => {
    const code = totp.generate(secret, noon)

    expect(totp.verify(secret, code, secondsFrom(noon, 120))).toBe(false)
  })

  it('rejects a code made with another secret', () => {
    const code = new TotpService().generate(totp.createSecret(), noon)

    expect(totp.verify(secret, code, noon)).toBe(false)
  })

  it('rejects something that is not a code', () => {
    expect(totp.verify(secret, '000', noon)).toBe(false)
  })

  it('gives every secret a different code at the same moment', () => {
    const other = totp.createSecret()

    expect(totp.generate(secret, noon)).not.toBe(totp.generate(other, noon))
  })

  it('counts down to the next code', () => {
    const remaining = totp.secondsRemaining(noon)

    expect(remaining).toBeGreaterThan(0)
    expect(remaining).toBeLessThanOrEqual(30)
  })
})
