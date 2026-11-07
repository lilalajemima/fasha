import { describe, expect, it } from 'vitest'
import { dayBlock, hasPassed, initials, meta, quantity, sentenceCase, whenLabel } from './format'

// These format dates, so the timezone is pinned in vitest.config.ts. Without
// that, half of them pass in Kigali and fail in CI.
describe('counting things in words', () => {
  it('says one volunteer rather than 1 volunteers', () => {
    expect(quantity(1, 'volunteer')).toBe('1 volunteer')
  })

  it('adds an s for anything else', () => {
    expect(quantity(18, 'volunteer')).toBe('18 volunteers')
    expect(quantity(0, 'volunteer')).toBe('0 volunteers')
  })

  it('takes a plural that is not just an s', () => {
    expect(quantity(2, 'person', 'people')).toBe('2 people')
  })
})

describe('the meta line under a title', () => {
  // Nothing is printed to say a value is missing: a sector that was never set
  // simply does not appear, rather than showing "Sector: none".
  it('joins only the parts that exist', () => {
    expect(meta('Kimironko', null, 'Virtual', false)).toBe('Kimironko · Virtual')
  })

  it('returns an empty string when there is nothing to say', () => {
    expect(meta(null, undefined, false)).toBe('')
  })
})

describe('tidying values up for the page', () => {
  it('turns a database enum into a sentence', () => {
    expect(sentenceCase('PENDING_APPROVAL')).toBe('Pending approval')
  })

  it('reduces a name to initials', () => {
    expect(initials('Lilala Runiga')).toBe('LR')
  })
})

describe('when the work happens', () => {
  it('gives nothing when nobody has said', () => {
    expect(whenLabel(null, null)).toBeNull()
  })

  it('uses the start when there is one', () => {
    expect(whenLabel('2026-11-28T09:00:00.000Z', null)).toBe('Sat, 28 Nov 2026')
  })

  // Virtual work has no start, only a day the deliverables are due, and it
  // reads as a deadline rather than as an event.
  it('reads an end on its own as a due date', () => {
    expect(whenLabel(null, '2026-11-28T09:00:00.000Z')).toBe('Due by Sat, 28 Nov 2026')
  })
})

describe('the date tile', () => {
  it('splits a date into the two lines the tile draws', () => {
    expect(dayBlock('2026-11-28T09:00:00.000Z')).toEqual({ weekday: 'Sat', date: '28 Nov' })
  })
})

describe('whether a date is behind us', () => {
  it('is true for a date in the past', () => {
    expect(hasPassed('2000-01-01T00:00:00.000Z')).toBe(true)
  })

  it('is false for a date well ahead', () => {
    expect(hasPassed('2099-01-01T00:00:00.000Z')).toBe(false)
  })
})
