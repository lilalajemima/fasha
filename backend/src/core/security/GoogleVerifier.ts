import { createPublicKey, verify, type webcrypto } from 'node:crypto'
import { ForbiddenError, UnauthorisedError, UnavailableError } from '../errors/HttpErrors'

/** Who Google says this is. The id is Google's ("sub"), stable for life. */
export type GoogleIdentity = {
  googleId: string
  email: string
  name: string
}

/** What the services depend on, so a test can stand in for Google. */
export interface GoogleCheck {
  verify(credential: string): Promise<GoogleIdentity>
}

type Jwk = webcrypto.JsonWebKey & { kid?: string }

export type KeySource = () => Promise<{ keys: Jwk[]; maxAgeSeconds: number }>

const KEYS_URL = 'https://www.googleapis.com/oauth2/v3/certs'
const ISSUERS = ['accounts.google.com', 'https://accounts.google.com']

// Clocks drift, and a token minted a few seconds "in the future" by Google's
// clock is still Google's token.
const SKEW_SECONDS = 60

// Google rotates its signing keys every few weeks, so a key id we have not
// seen means "fetch again". A made-up key id must not mean that on every
// request, or anyone could make this server hammer Google.
const REFETCH_AFTER_MS = 60_000

export const fetchGoogleKeys: KeySource = async () => {
  const response = await fetch(KEYS_URL)

  if (!response.ok) {
    throw new UnavailableError('Google sign-in could not be checked just now. Try again.')
  }

  const maxAge = /max-age=(\d+)/.exec(response.headers.get('cache-control') ?? '')
  const body = (await response.json()) as { keys: Jwk[] }

  return { keys: body.keys, maxAgeSeconds: maxAge ? Number(maxAge[1]) : 3600 }
}

function rejected(): UnauthorisedError {
  return new UnauthorisedError('That Google sign-in could not be confirmed. Try again.')
}

function readPart(part: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'))

    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>
  } catch {
    throw rejected()
  }

  throw rejected()
}

/**
 * Checks the ID token Google's button hands the browser, the same way
 * Google's own library does, with nothing but Node's crypto: the signature
 * against Google's published keys, then who it was issued by, who it was
 * issued for, and when it runs out. Only then is anything in it believed.
 */
export class GoogleVerifier implements GoogleCheck {
  private keys: Jwk[] = []
  private keysUntil = 0
  private fetchedAt = 0

  constructor(
    private readonly clientId: string | null,
    private readonly source: KeySource = fetchGoogleKeys,
    private readonly now: () => number = () => Date.now(),
  ) {}

  get enabled(): boolean {
    return this.clientId !== null
  }

  async verify(credential: string): Promise<GoogleIdentity> {
    if (this.clientId === null) {
      throw new UnavailableError('Google sign-in is not set up on this server yet.')
    }

    const parts = credential.split('.')

    if (parts.length !== 3) throw rejected()

    const [rawHeader, rawPayload, rawSignature] = parts
    const header = readPart(rawHeader)
    const payload = readPart(rawPayload)

    if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw rejected()

    const key = await this.keyFor(header.kid)

    if (!key) throw rejected()

    const genuine = verify(
      'RSA-SHA256',
      Buffer.from(`${rawHeader}.${rawPayload}`),
      createPublicKey({ key, format: 'jwk' }),
      Buffer.from(rawSignature, 'base64url'),
    )

    if (!genuine) throw rejected()

    const seconds = Math.floor(this.now() / 1000)

    if (typeof payload.iss !== 'string' || !ISSUERS.includes(payload.iss)) throw rejected()
    if (payload.aud !== this.clientId) throw rejected()
    if (typeof payload.exp !== 'number' || payload.exp + SKEW_SECONDS < seconds) throw rejected()
    if (typeof payload.iat === 'number' && payload.iat - SKEW_SECONDS > seconds) throw rejected()
    if (typeof payload.sub !== 'string' || payload.sub === '') throw rejected()
    if (typeof payload.email !== 'string' || payload.email === '') throw rejected()

    // An address Google has not confirmed could belong to anyone, and Fasha
    // uses the address to find an existing account to sign into.
    if (payload.email_verified !== true && payload.email_verified !== 'true') {
      throw new ForbiddenError('Google has not confirmed that email address, so Fasha cannot use it.')
    }

    const email = payload.email.toLowerCase()
    const name = typeof payload.name === 'string' && payload.name.trim() !== ''
      ? payload.name.trim()
      : email.split('@')[0]

    return { googleId: payload.sub, email, name }
  }

  private async keyFor(kid: string): Promise<Jwk | null> {
    const time = this.now()
    const cached = time < this.keysUntil ? this.keys.find(key => key.kid === kid) : undefined

    if (cached) return cached
    if (time < this.keysUntil && time - this.fetchedAt < REFETCH_AFTER_MS) return null

    const { keys, maxAgeSeconds } = await this.source()

    this.keys = keys
    this.fetchedAt = time
    this.keysUntil = time + maxAgeSeconds * 1000

    return keys.find(key => key.kid === kid) ?? null
  }
}
