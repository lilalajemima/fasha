import type { Request, Response } from 'express'
import { describe, expect, it } from 'vitest'
import { authorise } from './authorise'

function attempt(role: string | null, ...allowed: string[]) {
  const req = { user: role ? { userId: 'someone', role } : undefined } as Request
  let passed = false

  try {
    authorise(...allowed)(req, {} as Response, () => {
      passed = true
    })
  } catch (error) {
    return { passed, status: (error as { statusCode: number }).statusCode }
  }

  return { passed, status: null }
}

describe('checking what somebody may do', () => {
  it('lets a role on the list through', () => {
    expect(attempt('ADMIN', 'ADMIN')).toEqual({ passed: true, status: null })
    expect(attempt('ORGANISATION', 'VOLUNTEER', 'ORGANISATION').passed).toBe(true)
  })

  it('refuses a role that is not on the list', () => {
    expect(attempt('VOLUNTEER', 'ADMIN')).toEqual({ passed: false, status: 403 })
    expect(attempt('ORGANISATION', 'ADMIN')).toEqual({ passed: false, status: 403 })
  })

  it('asks somebody nobody has identified to sign in, rather than refusing them', () => {
    expect(attempt(null, 'ADMIN')).toEqual({ passed: false, status: 401 })
  })

  it('matches the role exactly', () => {
    expect(attempt('admin', 'ADMIN').passed).toBe(false)
  })
})
