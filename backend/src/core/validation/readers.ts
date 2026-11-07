import { AVAILABILITY_SLOTS, isAvailabilitySlot } from '../domain/catalogue'
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
// Roughly 150KB once decoded. The browser resizes to about 256px first.
const MAX_IMAGE_CHARS = 200_000

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

/**
 * Tags are matched against each other, so they have to come from the one
 * catalogue. Pass `allowed` and anything else is refused here: a typo cannot
 * reach the database and then quietly score zero against everything for ever.
 */
export function readTagList(body: Body, field: string, allowed?: readonly string[]): string[] {
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

  const unique = [...new Set(tags)]

  if (allowed) {
    const stranger = unique.find(tag => !allowed.includes(tag))

    if (stranger) {
      throw new BadRequestError(`"${stranger}" is not on the list Fasha matches on`)
    }
  }

  return unique
}

// A PDF arrives as a data URL. One megabyte of file is about 1.4M characters.
const MAX_PDF_CHARS = 1_400_000
const PDF_PREFIX = 'data:application/pdf;base64,'

export type Brief = { name: string; data: string }

/**
 * An optional PDF brief. Returns undefined when the field was not sent at all
 * (leave what is stored alone), null when it was sent empty (remove it), and
 * the file when there is one.
 */
export function readOptionalPdf(body: Body, field: string): Brief | null | undefined {
  const value = body[field]

  if (value === undefined) return undefined
  if (value === null) return null

  if (typeof value !== 'object') {
    throw new BadRequestError(`${field} must be a file`)
  }

  const { name, dataUrl } = value as { name?: unknown; dataUrl?: unknown }

  if (typeof name !== 'string' || typeof dataUrl !== 'string') {
    throw new BadRequestError(`${field} must carry a name and the file`)
  }

  if (!dataUrl.startsWith(PDF_PREFIX)) {
    throw new BadRequestError('The brief has to be a PDF')
  }

  if (dataUrl.length > MAX_PDF_CHARS) {
    throw new BadRequestError('That PDF is larger than 1MB. Send a smaller one.')
  }

  return { name: name.trim().slice(0, 120) || 'brief.pdf', data: dataUrl.slice(PDF_PREFIX.length) }
}

export function readAvailability(body: Body, field: string): string[] {
  const value = body[field]

  if (value === undefined || value === null) return []

  if (!Array.isArray(value)) {
    throw new BadRequestError(`${field} must be a list`)
  }

  const slots = [
    ...new Set(
      value
        .filter((slot): slot is string => typeof slot === 'string')
        .map(slot => slot.trim().toUpperCase())
        .filter(slot => slot.length > 0),
    ),
  ]

  const stranger = slots.find(slot => !isAvailabilitySlot(slot))

  if (stranger) {
    throw new BadRequestError(`${field} must hold times of the week, not "${stranger}"`)
  }

  return AVAILABILITY_SLOTS.filter(slot => slots.includes(slot))
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
