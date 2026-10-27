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

export function readPassword(body: Body): string {
  return readString(body, 'password', MIN_PASSWORD_LENGTH)
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
