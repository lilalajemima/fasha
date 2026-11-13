import { generateKeyPairSync, sign, type webcrypto } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { GoogleVerifier, type KeySource } from './GoogleVerifier'

const CLIENT = 'fasha-test.apps.googleusercontent.com'
const NOW = Date.UTC(2026, 10, 15, 9, 0, 0)
const SECONDS = Math.floor(NOW / 1000)

const pair = generateKeyPairSync('rsa', { modulusLength: 2048 })
const stranger = generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwk = { ...(pair.publicKey.export({ format: 'jwk' }) as webcrypto.JsonWebKey), kid: 'key-1', alg: 'RS256', use: 'sig' }

function encode(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function tokenFor(
  claims: Record<string, unknown> = {},
  { kid = 'key-1', alg = 'RS256', key = pair.privateKey } = {},
): string {
  const header = encode({ alg, kid, typ: 'JWT' })
  const payload = encode({
    iss: 'https://accounts.google.com',
    aud: CLIENT,
    sub: '109876543210',
    email: 'Amara.Mensah@Gmail.com',
    email_verified: true,
    name: 'Amara Mensah',
    iat: SECONDS - 10,
    exp: SECONDS + 3600,
    ...claims,
  })
  const signature = sign('RSA-SHA256', Buffer.from(`${header}.${payload}`), key).toString('base64url')

  return `${header}.${payload}.${signature}`
}

function verifierWith(keys = [jwk], clock = () => NOW) {
  const calls = { count: 0 }
  const source: KeySource = async () => {
    calls.count += 1
    return { keys: [...keys], maxAgeSeconds: 3600 }
  }

  return { verifier: new GoogleVerifier(CLIENT, source, clock), calls }
}

describe('checking a Google sign-in', () => {
  it('believes a token Google signed for this app', async () => {
    const { verifier } = verifierWith()

    await expect(verifier.verify(tokenFor())).resolves.toEqual({
      googleId: '109876543210',
      email: 'amara.mensah@gmail.com',
      name: 'Amara Mensah',
    })
  })

  it('rejects a token whose contents were changed after signing', async () => {
    const { verifier } = verifierWith()
    const [header, , signature] = tokenFor().split('.')
    const forged = encode({ iss: 'https://accounts.google.com', aud: CLIENT, sub: 'someone-else', email: 'x@y.z', email_verified: true, exp: SECONDS + 60 })

    await expect(verifier.verify(`${header}.${forged}.${signature}`)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('rejects a token signed by any other key', async () => {
    const { verifier } = verifierWith()

    await expect(verifier.verify(tokenFor({}, { key: stranger.privateKey }))).rejects.toMatchObject({ statusCode: 401 })
  })

  it('rejects a token issued for a different app', async () => {
    const { verifier } = verifierWith()

    await expect(verifier.verify(tokenFor({ aud: 'someone-else.apps.googleusercontent.com' }))).rejects.toMatchObject({ statusCode: 401 })
  })

  it('rejects a token from anyone but Google', async () => {
    const { verifier } = verifierWith()

    await expect(verifier.verify(tokenFor({ iss: 'https://accounts.evil.example' }))).rejects.toMatchObject({ statusCode: 401 })
  })

  it('rejects an expired token, but allows a minute of clock drift', async () => {
    const { verifier } = verifierWith()

    await expect(verifier.verify(tokenFor({ exp: SECONDS - 120 }))).rejects.toMatchObject({ statusCode: 401 })
    await expect(verifier.verify(tokenFor({ exp: SECONDS - 30 }))).resolves.toMatchObject({ googleId: '109876543210' })
  })

  it('refuses an address Google has not confirmed', async () => {
    const { verifier } = verifierWith()

    await expect(verifier.verify(tokenFor({ email_verified: false }))).rejects.toMatchObject({ statusCode: 403 })
  })

  it('refuses tokens that are not signed the way Google signs them', async () => {
    const { verifier } = verifierWith()
    const unsigned = `${encode({ alg: 'none', kid: 'key-1' })}.${encode({ sub: 'x' })}.`

    await expect(verifier.verify(unsigned)).rejects.toMatchObject({ statusCode: 401 })
    await expect(verifier.verify(tokenFor({}, { alg: 'HS256' }))).rejects.toMatchObject({ statusCode: 401 })
    await expect(verifier.verify('not-a-token')).rejects.toMatchObject({ statusCode: 401 })
  })

  it('fetches Google\'s keys once and reuses them', async () => {
    const { verifier, calls } = verifierWith()

    await verifier.verify(tokenFor())
    await verifier.verify(tokenFor())

    expect(calls.count).toBe(1)
  })

  it('does not let made-up key ids make it call Google over and over', async () => {
    const { verifier, calls } = verifierWith()

    await verifier.verify(tokenFor())
    await expect(verifier.verify(tokenFor({}, { kid: 'nonsense-1' }))).rejects.toMatchObject({ statusCode: 401 })
    await expect(verifier.verify(tokenFor({}, { kid: 'nonsense-2' }))).rejects.toMatchObject({ statusCode: 401 })

    expect(calls.count).toBe(1)
  })

  it('picks up a new key when Google rotates them', async () => {
    let time = NOW
    const next = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const rotated = { ...(next.publicKey.export({ format: 'jwk' }) as webcrypto.JsonWebKey), kid: 'key-2', alg: 'RS256', use: 'sig' }
    const keys = [jwk]
    const { verifier, calls } = verifierWith(keys, () => time)

    await verifier.verify(tokenFor())
    keys.push(rotated)
    time += 2 * 60_000

    await expect(verifier.verify(tokenFor({ iat: SECONDS + 100, exp: SECONDS + 3600 }, { kid: 'key-2', key: next.privateKey })))
      .resolves.toMatchObject({ googleId: '109876543210' })
    expect(calls.count).toBe(2)
  })

  it('says plainly when the server has no client id', async () => {
    const verifier = new GoogleVerifier(null)

    expect(verifier.enabled).toBe(false)
    await expect(verifier.verify(tokenFor())).rejects.toMatchObject({ statusCode: 503 })
  })
})
