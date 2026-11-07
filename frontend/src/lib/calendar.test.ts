import { describe, expect, it } from 'vitest'
import {
  destinationFor,
  fromInputValue,
  inputValue,
  isSameDay,
  marksFrom,
  marksOn,
  monthGrid,
  monthLabel,
  startOfMonth,
  startOfWeek,
  weekDays,
  weekLabel,
} from './calendar'
import { makeOpportunity } from './fixtures'

// Every one of these takes the current time as an argument rather than reading
// the clock, which is the only reason they can be tested at all: the answer for
// a given opportunity at a given moment never changes.
const NOW = new Date('2026-11-07T10:00:00.000Z')

describe('where a calendar entry takes you', () => {
  it('goes to the applicants while applications are still open', () => {
    expect(destinationFor(makeOpportunity(), NOW)).toBe(
      '/manage/opportunities/opp-1/applications',
    )
  })

  it('goes to the register once nobody else can apply and the day has not come', () => {
    const closed = makeOpportunity({ applicationDeadline: '2026-11-01T00:00:00.000Z' })

    expect(destinationFor(closed, NOW)).toBe('/manage/attendance?event=opp-1')
  })

  it('keeps sending virtual work to its applicants, because there is no door', () => {
    const closed = makeOpportunity({
      mode: 'VIRTUAL',
      applicationDeadline: '2026-11-01T00:00:00.000Z',
      startsAt: null,
      endsAt: '2026-11-25T00:00:00.000Z',
    })

    expect(destinationFor(closed, NOW)).toBe('/manage/opportunities/opp-1/applications')
  })

  it('goes to the register when an event is over', () => {
    const over = makeOpportunity({ startsAt: '2026-11-01T08:00:00.000Z' })

    expect(destinationFor(over, NOW)).toBe('/manage/attendance?event=opp-1')
  })

  it('goes to the deliverables when virtual work is over', () => {
    const over = makeOpportunity({
      mode: 'VIRTUAL',
      startsAt: null,
      endsAt: '2026-11-01T08:00:00.000Z',
    })

    expect(destinationFor(over, NOW)).toBe('/manage/review?opportunity=opp-1')
  })

  // A deadline set after the event itself is a mistake somebody can make in the
  // form, and it must not send the organiser back to the applicants of work
  // that has already happened.
  it('lets being over win over a deadline that is still open', () => {
    const odd = makeOpportunity({
      startsAt: '2026-11-01T08:00:00.000Z',
      applicationDeadline: '2026-12-20T00:00:00.000Z',
    })

    expect(destinationFor(odd, NOW)).toBe('/manage/attendance?event=opp-1')
  })
})

describe('turning opportunities into marks', () => {
  it('draws the day it happens and the day applications close', () => {
    const marks = marksFrom([makeOpportunity()], NOW)

    expect(marks.map(mark => mark.kind)).toEqual(['HAPPENING', 'DEADLINE'])
    expect(marks.map(mark => mark.id)).toEqual(['opp-1:happening', 'opp-1:deadline'])
  })

  it('draws only the deadline when nobody has said when it happens', () => {
    const undated = makeOpportunity({ startsAt: null, endsAt: null })

    expect(marksFrom([undated], NOW).map(mark => mark.kind)).toEqual(['DEADLINE'])
  })

  // Virtual work has no start time, so the day its deliverables are due is the
  // day worth drawing.
  it('treats the deliverable deadline of virtual work as the day it happens', () => {
    const virtual = makeOpportunity({
      mode: 'VIRTUAL',
      startsAt: null,
      endsAt: '2026-11-30T00:00:00.000Z',
    })
    const happening = marksFrom([virtual], NOW).find(mark => mark.kind === 'HAPPENING')

    expect(happening?.at.toISOString()).toBe('2026-11-30T00:00:00.000Z')
  })

  it('marks an initiative proposed by a resident as a citizen one', () => {
    const citizen = makeOpportunity({
      creator: { id: 'volunteer-1', name: 'Amara Mensah', role: 'VOLUNTEER' },
    })

    expect(marksFrom([citizen], NOW).every(mark => mark.citizen)).toBe(true)
    expect(marksFrom([makeOpportunity()], NOW).every(mark => mark.citizen)).toBe(false)
  })

  it('lets the page decide where an entry leads', () => {
    const marks = marksFrom([makeOpportunity()], NOW, item => `/admin/opportunity/${item.id}`)

    expect(marks.every(mark => mark.to === '/admin/opportunity/opp-1')).toBe(true)
  })

  it('finds what is on one day and leaves the rest out', () => {
    const marks = marksFrom([makeOpportunity()], NOW)

    expect(marksOn(marks, new Date(2026, 10, 25)).map(mark => mark.id)).toEqual([
      'opp-1:happening',
    ])
    expect(marksOn(marks, new Date(2026, 10, 26))).toEqual([])
  })
})

describe('the shape of a week and a month', () => {
  // A Rwandan week is read Monday first, so a Saturday belongs to the week that
  // started five days earlier rather than to the one beginning the next day.
  it('starts a week on the Monday before', () => {
    expect(inputValue(startOfWeek(new Date(2026, 10, 7)))).toBe('2026-11-02')
  })

  it('names a week that stays inside one month', () => {
    expect(weekLabel(startOfWeek(new Date(2026, 10, 7)))).toBe('2 to 8 November 2026')
  })

  it('names a week that crosses the turn of the year', () => {
    expect(weekLabel(startOfWeek(new Date(2025, 11, 30)))).toBe('29 December to 4 January 2026')
  })

  it('always draws six weeks, so the grid does not change height', () => {
    expect(monthGrid(startOfMonth(new Date(2026, 10, 7)), []).length).toBe(42)
  })

  it('gives seven days for a week', () => {
    expect(weekDays(new Date(2026, 10, 7), []).length).toBe(7)
  })

  it('names the month and the day the way the page prints them', () => {
    expect(monthLabel(new Date(2026, 10, 7))).toBe('November 2026')
  })
})

describe('the date picker', () => {
  // A date input works in local time. Going through an ISO string would land on
  // the day before for anybody east of Greenwich, which is everybody here.
  it('reads a date back as the same day it was given', () => {
    expect(inputValue(new Date(2026, 10, 7))).toBe('2026-11-07')
    expect(inputValue(fromInputValue('2026-11-07')!)).toBe('2026-11-07')
  })

  it('returns nothing for a value that is not a date', () => {
    expect(fromInputValue('rubbish')).toBeNull()
    expect(fromInputValue('')).toBeNull()
  })

  it('compares two days without their times', () => {
    expect(isSameDay(new Date(2026, 10, 7, 1), new Date(2026, 10, 7, 23))).toBe(true)
    expect(isSameDay(new Date(2026, 10, 7), new Date(2026, 10, 8))).toBe(false)
  })
})
