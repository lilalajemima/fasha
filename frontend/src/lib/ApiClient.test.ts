import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { memoryStorage } from '../test/storage'
import { ApiClient, ApiError } from './ApiClient'
import { TokenStore } from './TokenStore'

type Sent = { url: string; method: string; headers: Record<string, string>; body: string | undefined }

let sent: Sent[] = []

// Answers every request with the given status and body, and keeps a note of
// what was asked for.
function serverAnswering(status: number, body: string) {
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    sent.push({
      url,
      method: init.method ?? 'GET',
      headers: init.headers as Record<string, string>,
      body: init.body as string | undefined,
    })

    return new Response(body === '' ? null : body, { status })
  })
}

async function failureOf(request: Promise<unknown>): Promise<ApiError> {
  try {
    await request
  } catch (error) {
    return error as ApiError
  }

  throw new Error('Expected the request to fail')
}

function client() {
  return new ApiClient('https://api.fasha.test', new TokenStore('fasha.token'))
}

beforeEach(() => {
  sent = []
  vi.stubGlobal('localStorage', memoryStorage())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('talking to the API', () => {
  it('sends JSON with the token of whoever is signed in', async () => {
    localStorage.setItem('fasha.token', 'a-token')
    serverAnswering(200, '{"ok":true}')

    await expect(client().post('/applications', { motivation: 'I live nearby' })).resolves.toEqual({ ok: true })

    expect(sent[0]).toEqual({
      url: 'https://api.fasha.test/applications',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer a-token' },
      body: '{"motivation":"I live nearby"}',
    })
  })

  it('sends no Authorization header when nobody is signed in', async () => {
    serverAnswering(200, '[]')

    await client().get('/opportunities')

    expect(sent[0].headers).toEqual({})
    expect(sent[0].body).toBeUndefined()
  })

  it('gives back nothing for an empty reply', async () => {
    serverAnswering(204, '')

    await expect(client().delete('/opportunities/one')).resolves.toBeNull()
  })

  it('passes on the message the server gave', async () => {
    serverAnswering(409, '{"error":"An account with that email already exists"}')

    const failure = await failureOf(client().post('/auth/register', {}))

    expect(failure).toBeInstanceOf(ApiError)
    expect(failure.status).toBe(409)
    expect(failure.message).toBe('An account with that email already exists')
  })

  it('falls back to the status when the server gave no message', async () => {
    serverAnswering(500, '{}')

    await expect(client().get('/opportunities')).rejects.toThrow('Request failed (500)')
  })

  it('shows a reply that is not JSON as it came, such as a proxy error page', async () => {
    serverAnswering(502, 'Bad gateway')

    await expect(client().get('/opportunities')).rejects.toThrow('Bad gateway')
  })

  it('says plainly when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('Failed to fetch')
    })

    const failure = await failureOf(client().get('/opportunities'))

    expect(failure).toBeInstanceOf(ApiError)
    expect(failure.status).toBe(0)
    expect(failure.message).toContain('Cannot reach the server')
  })

  it('refuses a download that did not succeed', async () => {
    serverAnswering(403, '{"error":"No"}')

    await expect(client().download('/admin/report.csv')).rejects.toThrow('Could not download that file (403)')
  })

  it('hands over a file that did download', async () => {
    serverAnswering(200, 'Name\nAmara')

    const file = await client().download('/admin/report.csv')

    expect(await file.text()).toBe('Name\nAmara')
  })
})

describe('the saved token', () => {
  it('is kept, read and cleared under its own key', () => {
    const tokens = new TokenStore('fasha.token')

    expect(tokens.read()).toBeNull()

    tokens.save('a-token')

    expect(tokens.read()).toBe('a-token')
    expect(localStorage.getItem('fasha.token')).toBe('a-token')

    tokens.clear()

    expect(tokens.read()).toBeNull()
  })
})
