import { describe, expect, it } from 'vitest'
import type { ActivityRow, OpportunityView } from '../../lib/types'
import {
  comparePhrase,
  decisionOf,
  interestPhrase,
  kindOf,
  periodPhrase,
  previousSpan,
  rangeFor,
  spanLabel,
  tallyActivity,
  tallyApprovals,
  topInterests,
  within,
} from './stats'

function row(overrides: Partial<ActivityRow> = {}): ActivityRow {
  return {
    id: 'opportunity-1',
    title: 'Restore the wetland path',
    sector: 'Kimironko',
    location: 'Kimironko wetland',
    mode: 'PHYSICAL',
    organiser: 'Green Neighbourhood',
    organiserRole: 'ORGANISATION',
    status: 'PUBLISHED',
    postedAt: '2026-10-01T08:00:00.000Z',
    happenedAt: '2026-10-18T08:00:00.000Z',
    applications: 0,
    accepted: 0,
    checkedIn: 0,
    delivered: 0,
    ...overrides,
  }
}

function proposal(status: OpportunityView['status'], role: OpportunityView['creator']['role'] = 'VOLUNTEER') {
  return { status, creator: { id: 'someone', name: 'Someone', role } } as OpportunityView
}

describe('the period to compare against', () => {
  it('sets this month against the same days of last month', () => {
    expect(previousSpan({ from: '2026-11-01', to: '2026-11-14' }, 'month')).toEqual({ from: '2026-10-01', to: '2026-10-14' })
  })

  it('stops at the end of a shorter month rather than spilling into the next', () => {
    expect(previousSpan({ from: '2026-03-01', to: '2026-03-31' }, 'month')).toEqual({ from: '2026-02-01', to: '2026-02-28' })
  })

  it('goes back across the new year', () => {
    expect(previousSpan({ from: '2027-01-01', to: '2027-01-10' }, 'month')).toEqual({ from: '2026-12-01', to: '2026-12-10' })
  })

  it('sets any other period against the same number of days just before it', () => {
    expect(previousSpan({ from: '2026-10-15', to: '2026-11-14' }, '30')).toEqual({ from: '2026-09-14', to: '2026-10-14' })
    expect(previousSpan({ from: '2026-11-10', to: '2026-11-12' }, 'custom')).toEqual({ from: '2026-11-07', to: '2026-11-09' })
  })

  it('has nothing to compare all time with', () => {
    expect(previousSpan({ from: '', to: '' }, 'all')).toBeNull()
    expect(previousSpan({ from: '2026-11-01', to: '' }, 'custom')).toBeNull()
  })
})

describe('naming a period', () => {
  it('writes a stretch within one month briefly', () => {
    expect(spanLabel({ from: '2026-10-01', to: '2026-10-14' })).toBe('1–14 Oct')
    expect(spanLabel({ from: '2026-10-03', to: '2026-10-03' })).toBe('3 Oct')
  })

  it('names both months, and the years only when they differ', () => {
    expect(spanLabel({ from: '2026-09-18', to: '2026-10-16' })).toBe('18 Sep – 16 Oct')
    expect(spanLabel({ from: '2026-12-20', to: '2027-01-05' })).toBe('20 Dec 2026 – 5 Jan 2027')
  })

  it('counts a date on either edge as inside the period', () => {
    const span = { from: '2026-10-01', to: '2026-10-14' }

    expect(within('2026-10-01', span)).toBe(true)
    expect(within('2026-10-14', span)).toBe(true)
    expect(within('2026-09-30', span)).toBe(false)
    expect(within('2026-10-15', span)).toBe(false)
    expect(within('1999-01-01', { from: '', to: '' })).toBe(true)
  })
})

describe('the most common interests', () => {
  const tagged = [
    ['Healthcare', 'Education'],
    ['Healthcare'],
    ['Education', 'Healthcare', 'Healthcare'],
    ['Sports and recreation'],
    ['Arts and culture'],
  ]

  it('puts the most common first and counts a tag once per opportunity', () => {
    const { top } = topInterests(tagged)

    expect(top.map(entry => [entry.name, entry.count])).toEqual([
      ['Healthcare', 3],
      ['Education', 2],
      ['Arts and culture', 1],
    ])
  })

  it('gives each a share of the opportunities, so three of five is 60%', () => {
    expect(Math.round(topInterests(tagged).top[0].share * 100)).toBe(60)
  })

  it('breaks ties alphabetically so the order never jumps about', () => {
    expect(topInterests(tagged).top[2].name).toBe('Arts and culture')
  })

  it('counts the ones left out rather than dropping them quietly', () => {
    expect(topInterests(tagged).others).toBe(1)
  })

  it('copes with nothing at all', () => {
    expect(topInterests([])).toEqual({ top: [], others: 0 })
  })
})

describe('the sentence at the top of a report', () => {
  it('says which period it covers', () => {
    expect(periodPhrase({ from: '2026-11-01', to: '2026-11-14' })).toBe('In 1–14 Nov')
    expect(periodPhrase({ from: '', to: '' })).toBe('Over the last 12 months')
  })

  it('says how it compares with the period before', () => {
    expect(comparePhrase(20, 8, '1–14 Oct')).toBe(', 12 more than 1–14 Oct')
    expect(comparePhrase(3, 8, '1–14 Oct')).toBe(', 5 fewer than 1–14 Oct')
    expect(comparePhrase(8, 8, '1–14 Oct')).toBe(', the same as 1–14 Oct')
    expect(comparePhrase(8, null, null)).toBe('')
  })

  it('names the leading interests', () => {
    const top = topInterests([['Healthcare'], ['Healthcare', 'Education'], ['Sports and recreation']]).top

    expect(interestPhrase(top)).toBe(' Healthcare was the most common interest, followed by Education and Sports and recreation.')
    expect(interestPhrase(top.slice(0, 1))).toBe(' Healthcare was the most common interest.')
    expect(interestPhrase([])).toBe('')
  })
})

describe('adding up activity', () => {
  it('counts turning up for events and accepted work for virtual tasks', () => {
    const tally = tallyActivity([
      row({ applications: 10, accepted: 8, checkedIn: 6 }),
      row({ mode: 'VIRTUAL', applications: 4, accepted: 2, checkedIn: 9, delivered: 2 }),
    ])

    expect(tally).toEqual({ opportunities: 2, applied: 14, accepted: 10, tookPart: 8, turnout: 80 })
  })

  it('leaves turnout blank, not 0% or NaN, when nobody was accepted', () => {
    expect(tallyActivity([row()]).turnout).toBeNull()
    expect(tallyActivity([]).turnout).toBeNull()
  })
})

describe('the approvals history', () => {
  it('only counts citizen initiatives, since nothing else is reviewed', () => {
    expect(decisionOf(proposal('PUBLISHED', 'ORGANISATION'))).toBeNull()
    expect(decisionOf(proposal('PUBLISHED', 'ADMIN'))).toBeNull()
    expect(decisionOf(proposal('PUBLISHED'))).toBe('approved')
    expect(decisionOf(proposal('REJECTED'))).toBe('rejected')
    expect(decisionOf(proposal('PENDING_APPROVAL'))).toBe('waiting')
  })

  it('works out the approval rate from decided proposals only', () => {
    const tally = tallyApprovals([
      proposal('PUBLISHED'),
      proposal('PUBLISHED'),
      proposal('PUBLISHED'),
      proposal('REJECTED'),
      proposal('PENDING_APPROVAL'),
      proposal('PUBLISHED', 'ORGANISATION'),
    ])

    expect(tally).toEqual({ submitted: 5, approved: 3, rejected: 1, waiting: 1, rate: 75 })
  })

  it('has no rate until something has been decided', () => {
    expect(tallyApprovals([proposal('PENDING_APPROVAL')]).rate).toBeNull()
  })
})

describe('the period presets', () => {
  // Local dates, the way the date inputs show them.
  const day = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

  it('runs this month from the first to today', () => {
    const today = new Date()

    expect(rangeFor('month')).toEqual({ from: day(new Date(today.getFullYear(), today.getMonth(), 1)), to: day(today) })
  })

  it('runs the last 30 and 90 days up to today', () => {
    const today = new Date()
    const back = (days: number) => {
      const date = new Date(today)

      date.setDate(date.getDate() - days)

      return day(date)
    }

    expect(rangeFor('30')).toEqual({ from: back(30), to: day(today) })
    expect(rangeFor('90')).toEqual({ from: back(90), to: day(today) })
  })

  it('leaves all time and a custom period open', () => {
    expect(rangeFor('all')).toEqual({ from: '', to: '' })
    expect(rangeFor('custom')).toEqual({ from: '', to: '' })
  })

  it('names the two kinds of work', () => {
    expect(kindOf('VIRTUAL')).toBe('Virtual')
    expect(kindOf('PHYSICAL')).toBe('In person')
  })
})
