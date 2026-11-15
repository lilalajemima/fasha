import { describe, expect, it } from 'vitest'
import { SKILLS } from '../domain/catalogue'
import { BadRequestError } from '../errors/HttpErrors'
import {
  readApplicationDecision,
  readCount,
  readEmail,
  readFutureDate,
  readHours,
  readOptionalFutureDate,
  readOptionalImage,
  readOptionalPdf,
  readOptionalSector,
  readOptionalString,
  readPassword,
  readRole,
  readSector,
  readShortText,
  readStatus,
  readString,
  readUrl,
  readAvailability,
  readTagList,
} from './readers'

describe('readTagList against the catalogue', () => {
  it('keeps tags that are on the list', () => {
    const tags = readTagList({ skills: ['First aid', 'Graphic design'] }, 'skills', SKILLS)

    expect(tags).toEqual(['First aid', 'Graphic design'])
  })

  it('refuses a tag that is not on it', () => {
    expect(() => readTagList({ skills: ['Juggling'] }, 'skills', SKILLS)).toThrow(BadRequestError)
  })

  it('refuses a near miss rather than storing it', () => {
    expect(() => readTagList({ skills: ['graphic designs'] }, 'skills', SKILLS)).toThrow(
      'is not on the list Fasha matches on',
    )
  })

  it('still drops duplicates and blanks', () => {
    const tags = readTagList({ skills: ['First aid', ' First aid ', ''] }, 'skills', SKILLS)

    expect(tags).toEqual(['First aid'])
  })
})

describe('readAvailability', () => {
  it('accepts times of the week and returns them in week order', () => {
    const slots = readAvailability({ availabilitySlots: ['SUN_MORNING', 'MON_EVENING'] }, 'availabilitySlots')

    expect(slots).toEqual(['MON_EVENING', 'SUN_MORNING'])
  })

  it('treats a missing field as nothing chosen', () => {
    expect(readAvailability({}, 'availabilitySlots')).toEqual([])
  })

  it('refuses a slot that is not a real time', () => {
    expect(() =>
      readAvailability({ availabilitySlots: ['SOMEDAY_LATER'] }, 'availabilitySlots'),
    ).toThrow(BadRequestError)
  })
})

describe('text', () => {
  it('trims what it reads', () => {
    expect(readString({ name: '  Amara  ' }, 'name')).toBe('Amara')
  })

  it('refuses something that is not text, or only spaces', () => {
    expect(() => readString({ name: 42 }, 'name')).toThrow('name is required')
    expect(() => readString({}, 'name')).toThrow('name is required')
    expect(() => readString({ name: '   ' }, 'name')).toThrow(BadRequestError)
  })

  it('treats an empty optional field as nothing', () => {
    expect(readOptionalString({ bio: '' }, 'bio')).toBeNull()
    expect(readOptionalString({ bio: null }, 'bio')).toBeNull()
    expect(readOptionalString({}, 'bio')).toBeNull()
    expect(readOptionalString({ bio: ' hi ' }, 'bio')).toBe('hi')
  })

  it('holds short text to its limit', () => {
    expect(readShortText({ note: 'fine' }, 'note', 10)).toBe('fine')
    expect(readShortText({ note: '' }, 'note', 10)).toBeNull()
    expect(() => readShortText({ note: 'far too long here' }, 'note', 10)).toThrow('10 characters or fewer')
  })
})

describe('signing in and up', () => {
  it('stores an email in lower case, so one address is one account', () => {
    expect(readEmail({ email: ' Amara.Mensah@Example.RW ' })).toBe('amara.mensah@example.rw')
  })

  it('refuses something that is not an email address', () => {
    for (const email of ['amara', 'amara@', '@example.rw', 'amara@example', 'a b@example.rw']) {
      expect(() => readEmail({ email })).toThrow('Enter a valid email address')
    }
  })

  it('wants a password of at least eight characters', () => {
    expect(readPassword({ password: '12345678' })).toBe('12345678')
    expect(() => readPassword({ password: '1234567' })).toThrow('at least 8 characters')
  })

  it('lets nobody sign themselves up as an admin', () => {
    expect(readRole({ role: 'volunteer' })).toBe('VOLUNTEER')
    expect(readRole({ role: 'ORGANISATION' })).toBe('ORGANISATION')
    expect(() => readRole({ role: 'ADMIN' })).toThrow(BadRequestError)
    expect(() => readRole({ role: 'admin' })).toThrow(BadRequestError)
  })

  it('only lets an admin set an account active or deactivated, not deleted', () => {
    expect(readStatus({ status: 'deactivated' })).toBe('DEACTIVATED')
    expect(() => readStatus({ status: 'DELETED' })).toThrow(BadRequestError)
  })
})

describe('links people can click', () => {
  it('keeps a web address', () => {
    expect(readUrl({ proof: 'https://example.rw/poster.pdf' }, 'proof')).toBe('https://example.rw/poster.pdf')
    expect(readUrl({ proof: 'http://example.rw' }, 'proof')).toBe('http://example.rw')
  })

  it('refuses anything that would run code or open something else when clicked', () => {
    for (const proof of ['javascript:alert(1)', 'data:text/html,<script>', 'file:///etc/passwd', 'example.rw', ' javascript:alert(1)']) {
      expect(() => readUrl({ proof }, 'proof')).toThrow('must be a link starting with http')
    }
  })
})

describe('files carried in the request', () => {
  const pdf = 'data:application/pdf;base64,JVBERi0xLjQK'

  it('keeps a PDF brief and strips the prefix', () => {
    expect(readOptionalPdf({ brief: { name: ' plan.pdf ', dataUrl: pdf } }, 'brief')).toEqual({
      name: 'plan.pdf',
      data: 'JVBERi0xLjQK',
    })
  })

  it('tells apart leaving the brief alone, removing it and replacing it', () => {
    expect(readOptionalPdf({}, 'brief')).toBeUndefined()
    expect(readOptionalPdf({ brief: null }, 'brief')).toBeNull()
  })

  it('refuses a brief that is not a PDF', () => {
    expect(() => readOptionalPdf({ brief: { name: 'x.html', dataUrl: 'data:text/html;base64,PGgxPg==' } }, 'brief'))
      .toThrow('has to be a PDF')
    expect(() => readOptionalPdf({ brief: 'not a file' }, 'brief')).toThrow('must be a file')
    expect(() => readOptionalPdf({ brief: { name: 'x.pdf' } }, 'brief')).toThrow('must carry a name and the file')
  })

  it('refuses a PDF over the size limit', () => {
    const huge = pdf + 'A'.repeat(1_400_000)

    expect(() => readOptionalPdf({ brief: { name: 'big.pdf', dataUrl: huge } }, 'brief')).toThrow('larger than 1MB')
  })

  it('gives a brief with a blank name a name', () => {
    expect(readOptionalPdf({ brief: { name: '  ', dataUrl: pdf } }, 'brief')?.name).toBe('brief.pdf')
  })

  it('keeps a small picture and removes one on request', () => {
    const picture = 'data:image/png;base64,iVBORw0KGgo='

    expect(readOptionalImage({ avatar: picture }, 'avatar')).toBe(picture)
    expect(readOptionalImage({ avatar: null }, 'avatar')).toBeNull()
    expect(readOptionalImage({ avatar: '' }, 'avatar')).toBeNull()
  })

  it('refuses a picture in a format it does not store, or one that carries markup', () => {
    expect(() => readOptionalImage({ avatar: 'data:image/svg+xml;base64,PHN2Zz4=' }, 'avatar')).toThrow('not a picture')
    expect(() => readOptionalImage({ avatar: 'data:image/png;base64,abc<script>' }, 'avatar')).toThrow('not a picture')
    expect(() => readOptionalImage({ avatar: 'https://example.rw/me.png' }, 'avatar')).toThrow('not a picture')
  })

  it('refuses a picture that is too large', () => {
    const huge = 'data:image/png;base64,' + 'A'.repeat(200_000)

    expect(() => readOptionalImage({ avatar: huge }, 'avatar')).toThrow('too large')
  })
})

describe('numbers', () => {
  it('wants a whole number of places, above zero', () => {
    expect(readCount({ places: '12' }, 'places')).toBe(12)
    for (const places of ['0', '-3', '2.5', 'many', null]) {
      expect(() => readCount({ places }, 'places')).toThrow('whole number above zero')
    }
  })

  it('keeps hours to two decimal places, within the limit', () => {
    expect(readHours({ hours: '2.345' }, 'hours', 24)).toBe(2.35)
    expect(() => readHours({ hours: '0' }, 'hours', 24)).toThrow('above zero')
    expect(() => readHours({ hours: 'Infinity' }, 'hours', 24)).toThrow('above zero')
    expect(() => readHours({ hours: '25' }, 'hours', 24)).toThrow('cannot be more than 24')
  })
})

describe('dates and places', () => {
  it('wants a real date in the future', () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString()

    expect(readFutureDate({ at: tomorrow }, 'at').toISOString()).toBe(tomorrow)
    expect(() => readFutureDate({ at: 'next tuesday' }, 'at')).toThrow('valid date')
    expect(() => readFutureDate({ at: '2020-01-01T00:00:00Z' }, 'at')).toThrow('in the future')
  })

  it('treats an empty optional date as nothing', () => {
    expect(readOptionalFutureDate({ at: '' }, 'at')).toBeNull()
    expect(readOptionalFutureDate({}, 'at')).toBeNull()
  })

  it('only accepts a sector of Gasabo', () => {
    expect(readSector({ sector: 'Kimironko' }, 'sector')).toBe('Kimironko')
    expect(() => readSector({ sector: 'kimironko' }, 'sector')).toThrow(BadRequestError)
    expect(() => readSector({ sector: 'Nyarugenge' }, 'sector')).toThrow(BadRequestError)
    expect(readOptionalSector({ sector: '' }, 'sector')).toBeNull()
  })

  it('only takes the two decisions an organiser can make on an application', () => {
    expect(readApplicationDecision({ decision: 'accept' })).toBe('ACCEPT')
    expect(() => readApplicationDecision({ decision: 'APPROVE' })).toThrow(BadRequestError)
  })
})
