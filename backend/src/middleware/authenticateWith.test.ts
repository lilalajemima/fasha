import type { Request, Response } from 'express'
import { describe, expect, it } from 'vitest'
import { TokenService } from '../core/security/TokenService'
import { authenticateWith, type AccountLookup } from './authenticateWith'

const tokens = new TokenService('test-secret-value', '1h')
const elsewhere = new TokenService('a-different-secret', '1h')

type Account = { status: 'ACTIVE' | 'DEACTIVATED' | 'DELETED'; tokenVersion: number }

function accountsWith(accounts: Record<string, Account>): AccountLookup {
  return {
    async findById(id: string) {
      return accounts[id] ?? null
    },
  }
}

// Runs the check the way Express would and reports what happened: who it let
// through, or the error it stopped the request with.
async function attempt(accounts: AccountLookup, authorization?: string) {
  const req = { headers: authorization ? { authorization } : {} } as Request
  let passed = false

  try {
    await authenticateWith(accounts, tokens)(req, {} as Response, () => {
      passed = true
    })
  } catch (error) {
    return { passed, user: req.user, error: error as { statusCode: number; message: string } }
  }

  return { passed, user: req.user, error: null }
}

const active = accountsWith({ 'volunteer-1': { status: 'ACTIVE', tokenVersion: 0 } })

describe('checking who is asking', () => {
  it('lets a current token through and says who it belongs to', async () => {
    const token = tokens.issue({ userId: 'volunteer-1', role: 'VOLUNTEER', tokenVersion: 0 })
    const result = await attempt(active, `Bearer ${token}`)

    expect(result.passed).toBe(true)
    expect(result.user).toMatchObject({ userId: 'volunteer-1', role: 'VOLUNTEER' })
  })

  it('turns away a request with no token', async () => {
    const result = await attempt(active)

    expect(result.passed).toBe(false)
    expect(result.error?.statusCode).toBe(401)
  })

  it('turns away a header that is not a bearer token', async () => {
    const token = tokens.issue({ userId: 'volunteer-1', role: 'VOLUNTEER', tokenVersion: 0 })

    expect((await attempt(active, `Basic ${token}`)).error?.statusCode).toBe(401)
  })

  it('turns away a token signed with another secret', async () => {
    const token = elsewhere.issue({ userId: 'volunteer-1', role: 'ADMIN', tokenVersion: 0 })
    const result = await attempt(active, `Bearer ${token}`)

    expect(result.passed).toBe(false)
    expect(result.error?.statusCode).toBe(401)
  })

  it('turns away a token for an account that no longer exists', async () => {
    const token = tokens.issue({ userId: 'gone', role: 'VOLUNTEER', tokenVersion: 0 })

    expect((await attempt(active, `Bearer ${token}`)).error?.statusCode).toBe(401)
  })

  it('turns away a deleted account, even with a token that has not run out', async () => {
    const accounts = accountsWith({ 'volunteer-1': { status: 'DELETED', tokenVersion: 0 } })
    const token = tokens.issue({ userId: 'volunteer-1', role: 'VOLUNTEER', tokenVersion: 0 })
    const result = await attempt(accounts, `Bearer ${token}`)

    expect(result.passed).toBe(false)
    expect(result.error?.statusCode).toBe(401)
  })

  it('tells a deactivated account so, on its very next request', async () => {
    const accounts = accountsWith({ 'volunteer-1': { status: 'DEACTIVATED', tokenVersion: 0 } })
    const token = tokens.issue({ userId: 'volunteer-1', role: 'VOLUNTEER', tokenVersion: 0 })
    const result = await attempt(accounts, `Bearer ${token}`)

    expect(result.passed).toBe(false)
    expect(result.error?.statusCode).toBe(403)
    expect(result.error?.message).toContain('deactivated')
  })

  it('signs out other devices once the password has changed', async () => {
    const accounts = accountsWith({ 'volunteer-1': { status: 'ACTIVE', tokenVersion: 1 } })
    const before = tokens.issue({ userId: 'volunteer-1', role: 'VOLUNTEER', tokenVersion: 0 })
    const after = tokens.issue({ userId: 'volunteer-1', role: 'VOLUNTEER', tokenVersion: 1 })

    const stale = await attempt(accounts, `Bearer ${before}`)

    expect(stale.passed).toBe(false)
    expect(stale.error?.message).toContain('password was changed')
    expect((await attempt(accounts, `Bearer ${after}`)).passed).toBe(true)
  })

  it('reads a token from before versions existed as version zero', async () => {
    const token = tokens.issue({ userId: 'volunteer-1', role: 'VOLUNTEER' })

    expect((await attempt(active, `Bearer ${token}`)).passed).toBe(true)
  })
})
