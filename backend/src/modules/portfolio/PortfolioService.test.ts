import { describe, expect, it } from 'vitest'
import { NotFoundError } from '../../core/errors/HttpErrors'
import type { PortfolioOwner, ProfileChanges, ProfileStore } from '../profile/ProfileStore'
import { PortfolioService } from './PortfolioService'
import type { PortfolioRecord, PortfolioStore } from './PortfolioStore'

const owner: PortfolioOwner = {
  userId: 'volunteer-1',
  name: 'Amara Mensah',
  portfolioSlug: 'amara-mensah',
}

function makeEntry(overrides: Partial<PortfolioRecord> = {}): PortfolioRecord {
  return {
    id: 'entry-1',
    volunteerId: 'volunteer-1',
    opportunityId: 'opportunity-1',
    hoursCredited: 2.5,
    skillsCredited: ['Teamwork'],
    dateCredited: new Date('2026-11-14T12:00:00.000Z'),
    opportunity: { id: 'opportunity-1', title: 'Restore the wetland path', mode: 'PHYSICAL' },
    ...overrides,
  }
}

class FakeProfileStore implements ProfileStore {
  constructor(private readonly known: PortfolioOwner | null) {}

  async update(_userId: string, _changes: ProfileChanges) {}

  async findByUserId() {
    return this.known
  }

  async findBySlug() {
    return this.known
  }
}

class FakePortfolioStore implements PortfolioStore {
  constructor(
    private readonly records: PortfolioRecord[],
    private readonly organised = 0,
  ) {}

  async findForVolunteer() {
    return this.records
  }

  async countOrganised() {
    return this.organised
  }
}

function build(records: PortfolioRecord[], known: PortfolioOwner | null = owner, organised = 0) {
  return new PortfolioService(
    new FakePortfolioStore(records, organised),
    new FakeProfileStore(known),
  )
}

describe('a portfolio', () => {
  it('adds up the hours', async () => {
    const view = await build([makeEntry(), makeEntry({ id: 'entry-2', hoursCredited: 1.25 })]).mine({
      userId: 'volunteer-1',
      role: 'VOLUNTEER',
    })

    expect(view.totals.hours).toBe(3.75)
  })

  it('counts each opportunity once, however many entries it has', async () => {
    const view = await build([
      makeEntry(),
      makeEntry({ id: 'entry-2' }),
      makeEntry({ id: 'entry-3', opportunityId: 'opportunity-2' }),
    ]).bySlug('amara-mensah')

    expect(view.totals.opportunities).toBe(2)
  })

  it('gathers the skills without repeating them', async () => {
    const view = await build([
      makeEntry({ skillsCredited: ['Teamwork', 'Graphic design'] }),
      makeEntry({ id: 'entry-2', skillsCredited: ['Teamwork'] }),
    ]).bySlug('amara-mensah')

    expect(view.totals.skills).toEqual(['Graphic design', 'Teamwork'])
  })

  /**
   * Organising is reported separately from hours on purpose: an organiser must
   * never be the one verifying their own participation.
   */
  it('reports initiatives organised apart from hours verified', async () => {
    const view = await build([makeEntry()], owner, 3).bySlug('amara-mensah')

    expect(view.totals.organised).toBe(3)
    expect(view.totals.hours).toBe(2.5)
  })

  it('shows an empty portfolio rather than failing', async () => {
    const view = await build([]).bySlug('amara-mensah')

    expect(view.totals).toEqual({ hours: 0, opportunities: 0, organised: 0, skills: [] })
    expect(view.entries).toEqual([])
  })

  it('names the volunteer on the public page', async () => {
    const view = await build([makeEntry()]).bySlug('amara-mensah')

    expect(view.volunteer.name).toBe('Amara Mensah')
  })

  it('reports an address nobody owns', async () => {
    await expect(build([], null).bySlug('nobody')).rejects.toThrow(NotFoundError)
  })

  it('tells an organisation it keeps no portfolio', async () => {
    await expect(
      build([], null).mine({ userId: 'organisation-1', role: 'ORGANISATION' }),
    ).rejects.toThrow('Only volunteer accounts keep a portfolio')
  })
})