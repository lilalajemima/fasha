import { BadRequestError } from '../errors/HttpErrors'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

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

export function readRole(body: Body): 'VOLUNTEER' | 'ORGANISATION' {
  const role = readString(body, 'role')

  if (role !== 'VOLUNTEER' && role !== 'ORGANISATION') {
    throw new BadRequestError('role must be VOLUNTEER or ORGANISATION')
  }

  return role
}
