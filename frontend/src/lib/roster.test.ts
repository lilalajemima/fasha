import { describe, expect, it } from 'vitest'
import { makeApplication, makeCheckin } from './fixtures'
import { buildRoster, matches } from './roster'

// The register is a join, and the thing worth testing is that nobody falls out
// of it: not somebody who was accepted and never arrived, and not somebody who
// arrived without being accepted.
describe('building the register for an event', () => {
  it('lists everybody accepted, whether or not they turned up', () => {
    const rows = buildRoster(
      [makeApplication('v-1', 'Amara Mensah'), makeApplication('v-2', 'Zuba Keza')],
      [],
    )

    expect(rows.map(row => row.name)).toEqual(['Amara Mensah', 'Zuba Keza'])
    expect(rows.every(row => row.checkinId === null)).toBe(true)
  })

  it('sorts by name rather than by the order they applied', () => {
    const rows = buildRoster(
      [makeApplication('v-2', 'Zuba Keza'), makeApplication('v-1', 'Amara Mensah')],
      [],
    )

    expect(rows.map(row => row.name)).toEqual(['Amara Mensah', 'Zuba Keza'])
  })

  it('attaches a check in to the person it belongs to and leaves the rest empty', () => {
    const rows = buildRoster(
      [makeApplication('v-1', 'Amara Mensah'), makeApplication('v-2', 'Zuba Keza')],
      [makeCheckin('checkin-1', 'v-1', 'Amara Mensah')],
    )

    expect(rows[0].checkinId).toBe('checkin-1')
    expect(rows[1].checkinId).toBeNull()
  })

  // An organiser marking somebody present by hand can add a person who never
  // applied. Leaving them off the register would lose the record of them.
  it('still shows somebody who checked in without an accepted place', () => {
    const rows = buildRoster(
      [makeApplication('v-1', 'Amara Mensah')],
      [makeCheckin('checkin-9', 'v-9', 'Gatete Rukundo')],
    )

    expect(rows.map(row => row.name)).toEqual(['Amara Mensah', 'Gatete Rukundo'])
  })

  // Somebody who checked out and was let back in has two records. The open one
  // is the one the organiser needs to act on.
  it('prefers the check in that is still open', () => {
    const rows = buildRoster(
      [makeApplication('v-1', 'Amara Mensah')],
      [
        makeCheckin('closed', 'v-1', 'Amara Mensah', {
          checkedOutAt: '2026-11-25T11:00:00.000Z',
          hours: 3,
        }),
        makeCheckin('open', 'v-1', 'Amara Mensah'),
      ],
    )

    expect(rows[0].checkinId).toBe('open')
  })

  it('carries the hours through once somebody has checked out', () => {
    const rows = buildRoster(
      [makeApplication('v-1', 'Amara Mensah')],
      [
        makeCheckin('checkin-1', 'v-1', 'Amara Mensah', {
          checkedOutAt: '2026-11-25T11:00:00.000Z',
          hours: 3,
        }),
      ],
    )

    expect(rows[0].hours).toBe(3)
    expect(rows[0].checkedOutAt).toBe('2026-11-25T11:00:00.000Z')
  })
})

describe('searching the register', () => {
  const [row] = buildRoster([makeApplication('v-1', 'Amara Mensah')], [])

  it('ignores case and stray spaces, because people type both', () => {
    expect(matches(row, '  amARA ')).toBe(true)
  })

  it('matches part of a surname', () => {
    expect(matches(row, 'mensah')).toBe(true)
  })

  it('says no when nothing matches', () => {
    expect(matches(row, 'zuba')).toBe(false)
  })

  it('treats an empty search as matching everybody', () => {
    expect(matches(row, '')).toBe(true)
  })
})
