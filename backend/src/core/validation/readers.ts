import { SECTORS, isSector } from '../domain/sectors'
import { BadRequestError } from '../errors/HttpErrors'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8
const MAX_TAGS = 10

type Body = Record<string, unknown>

export function readString(body: Body, field: string, minLength = 1): string {
  const value = body[field]

  if (typeof value !== 'string') {
    throw new BadRequestError(`${field} is required`)
  }

  const trimmed = value.trim()

  if (trimmed.length < minLength) {
    throw new BadRequestError(`${field} must be at least ${minLength} characters`)
  }

  return trimmed
}

export function readEmail(body: Body): string {
  const email = readString(body, 'email').toLowerCase()

  if (!EMAIL_PATTERN.test(email)) {
    throw new BadRequestError('Enter a valid email address')
  }

  return email
}

export function readPassword(body: Body, field = 'password'): string {
  return readString(body, field, MIN_PASSWORD_LENGTH)
}

const IMAGE_PATTERN = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/
/** Roughly 150KB once decoded. The browser resizes to about 256px before sending. */
const MAX_IMAGE_CHARS = 200_000

/**
 * A picture arrives as a data URL the browser has already resized. Anything
 * else, or anything oversized, is refused here rather than stored and dealt
 * with later.
 */
export function readOptionalImage(body: Body, field: string): string | null {
  const value = body[field]

  if (value === null || value === '') {
    return null
  }

  if (typeof value !== 'string') {
    throw new BadRequestError(`${field} must be an image`)
  }

  if (value.length > MAX_IMAGE_CHARS) {
    throw new BadRequestError('That picture is too large. Choose a smaller one.')
  }

  if (!IMAGE_PATTERN.test(value)) {
    throw new BadRequestError('That is not a picture Fasha can store')
  }

  return value
}

export function readStatus(body: Body) {
  return readChoice(body, 'status', ['ACTIVE', 'DEACTIVATED'] as const)
}

export function readChoice<T extends string>(
  body: Body,
  field: string,
  options: readonly T[],
): T {
  const value = readString(body, field).toUpperCase()
  const chosen = options.find(option => option === value)

  if (!chosen) {
    throw new BadRequestError(`${field} must be one of: ${options.join(', ')}`)
  }

  return chosen
}

export function readRole(body: Body) {
  return readChoice(body, 'role', ['VOLUNTEER', 'ORGANISATION'] as const)
}

export function readOptionalString(body: Body, field: string): string | null {
  const value = body[field]

  if (value === undefined || value === null || value === '') return null

  return readString(body, field)
}

export function readTagList(body: Body, field: string): string[] {
  const value = body[field]

  if (value === undefined) return []

  if (!Array.isArray(value)) {
    throw new BadRequestError(`${field} must be a list`)
  }

  const tags = value
    .filter((tag): tag is string => typeof tag === 'string')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)

  if (tags.length > MAX_TAGS) {
    throw new BadRequestError(`${field} may hold at most ${MAX_TAGS} entries`)
  }

  return [...new Set(tags)]
}

export function readCount(body: Body, field: string): number {
  const value = Number(body[field])

  if (!Number.isInteger(value) || value < 1) {
    throw new BadRequestError(`${field} must be a whole number above zero`)
  }

  return value
}

export function readFutureDate(body: Body, field: string): Date {
  const value = new Date(String(body[field]))

  if (Number.isNaN(value.getTime())) {
    throw new BadRequestError(`${field} must be a valid date`)
  }

  if (value.getTime() <= Date.now()) {
    throw new BadRequestError(`${field} must be in the future`)
  }

  return value
}

export function readMode(body: Body) {
  return readChoice(body, 'mode', ['PHYSICAL', 'VIRTUAL'] as const)
}

export function readDecision(body: Body) {
  return readChoice(body, 'decision', ['APPROVE', 'REJECT'] as const)
}

export function readApplicationDecision(body: Body) {
  return readChoice(body, 'decision', ['ACCEPT', 'REJECT'] as const)
}

export function hasField(body: Body, field: string): boolean {
  return body[field] !== undefined
}

export function readShortText(body: Body, field: string, maxLength: number): string | null {
  const value = body[field]

  if (value === null || value === '') return null

  const text = readString(body, field)

  if (text.length > maxLength) {
    throw new BadRequestError(`${field} must be ${maxLength} characters or fewer`)
  }

  return text
}

export function readHours(body: Body, field: string, maxHours: number): number {
  const value = Number(body[field])

  if (!Number.isFinite(value) || value <= 0) {
    throw new BadRequestError(`${field} must be a number of hours above zero`)
  }

  if (value > maxHours) {
    throw new BadRequestError(`${field} cannot be more than ${maxHours}`)
  }

  return Math.round(value * 100) / 100
}

export function readUrl(body: Body, field: string): string {
  const value = readString(body, field)

  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    throw new BadRequestError(`${field} must be a link starting with http`)
  }

  return value
}

export function readSector(body: Body, field: string): string {
  const value = readString(body, field)

  if (!isSector(value)) {
    throw new BadRequestError(`${field} must be one of: ${SECTORS.join(', ')}`)
  }

  return value
}

export function readOptionalSector(body: Body, field: string): string | null {
  const value = body[field]

  if (value === null || value === undefined || value === '') return null

  return readSector(body, field)
}

export function readOptionalFutureDate(body: Body, field: string): Date | null {
  const value = body[field]

  if (value === null || value === undefined || value === '') return null

  return readFutureDate(body, field)
}
