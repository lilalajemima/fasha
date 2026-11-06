import { describe, expect, it } from 'vitest'
import { NotFoundError } from '../../core/errors/HttpErrors'
import type { PortfolioOwner, ProfileChanges, ProfileStore } from '../profile/ProfileStore'
import { PortfolioService } from './PortfolioService'
import type { OrganisedRecord, PortfolioRecord, PortfolioStore } from './PortfolioStore'

const owner: PortfolioOwner = {
  userId: 'volunteer-1',
  name: 'Amara Mensah',
  portfolioSlug: 'amara-mensah',
  avatar: 'data:image/jpeg;base64,AAAA',
  bio: 'I organise clean-ups around Kimironko.',
  skills: ['First aid', 'Gardening and planting'],
  interests: ['Climate and environment'],
  availabilitySlots: ['SAT_MORNING', 'SUN_AFTERNOON'],
}

function makeEntry(overrides: Partial<PortfolioRecord> = {}): PortfolioRecord {
  return {
    id: 'entry-1',
    volunteerId: 'volunteer-1',
    opportunityId: 'opportunity-1',
    hoursCredited: 2.5,
    skillsCredited: ['Gardening and planting'],
    dateCredited: new Date('2026-11-14T12:00:00.000Z'),
    opportunity: {
      id: 'opportunity-1',
      title: 'Restore the wetland path',
      description: 'Plant trees and clear the path with the neighbourhood team.',
      mode: 'PHYSICAL',
      creatorId: 'organisation-1',
      requiredSkills: ['Gardening and planting'],
      categories: ['Climate and environment'],
      startsAt: new Date('2026-11-14T06:00:00.000Z'),
      endsAt: new Date('2026-11-14T09:00:00.000Z'),
      creator: { name: 'Green Neighbourhood', role: 'ORGANISATION' },
      brief: null,
    },
    ...overrides,
  }
}

function makeOrganised(overrides: Partial<OrganisedRecord> = {}): OrganisedRecord {
  return {
    id: 'opportunity-9',
    title: 'Kimironko seed swap',
    description: 'Neighbours bring seedlings and swap what they have too much of.',
    mode: 'PHYSICAL',
    sector: 'Kimironko',
    location: 'Kimironko market',
    startsAt: new Date('2026-10-03T06:00:00.000Z'),
    endsAt: new Date('2026-10-03T09:00:00.000Z'),
    requiredSkills: [],
    categories: ['Food security and agriculture'],
    brief: { name: 'seed-swap.pdf' },
    people: 12,
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
    private readonly organised: OrganisedRecord[] = [],
  ) {}

  async findForVolunteer() {
    return this.records
  }

  async findOrganisedBy() {
    return this.organised
  }
}

function build(
  records: PortfolioRecord[],
  known: PortfolioOwner | null = owner,
  organised: OrganisedRecord[] = [],
) {
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
      makeEntry({ skillsCredited: ['First aid', 'Graphic design'] }),
      makeEntry({ id: 'entry-2', skillsCredited: ['First aid'] }),
    ]).bySlug('amara-mensah')

    expect(view.totals.skills).toEqual(['First aid', 'Graphic design'])
  })

  it('shows an empty portfolio rather than failing', async () => {
    const view = await build([]).bySlug('amara-mensah')

    expect(view.totals).toEqual({ hours: 0, opportunities: 0, organised: 0, skills: [] })
  })

  it('names the volunteer on the public page', async () => {
    const view = await build([makeEntry()]).bySlug('amara-mensah')

    expect(view.volunteer.name).toBe('Amara Mensah')
  })

  /** The public page is the one an employer sees, so it carries the face and the introduction. */
  it('carries the picture and the introduction', async () => {
    const view = await build([makeEntry()]).bySlug('amara-mensah')

    expect(view.volunteer.avatar).toBe('data:image/jpeg;base64,AAAA')
    expect(view.volunteer.bio).toBe('I organise clean-ups around Kimironko.')
  })

  it('carries what they say they can do, not only what was credited', async () => {
    const view = await build([makeEntry()]).bySlug('amara-mensah')

    expect(view.volunteer.skills).toContain('First aid')
    expect(view.volunteer.interests).toEqual(['Climate and environment'])
  })

  it('keeps what they ran apart from what they took part in', async () => {
    const view = await build([makeEntry()], owner, [makeOrganised()]).bySlug('amara-mensah')

    expect(view.totals.organised).toBe(1)
    expect(view.entries).toHaveLength(1)
    expect(view.organised[0].title).toBe('Kimironko seed swap')
  })

  it('says how many people an initiative reached, and where to read its brief', async () => {
    const view = await build([], owner, [makeOrganised()]).bySlug('amara-mensah')

    expect(view.organised[0].people).toBe(12)
    expect(view.organised[0].brief?.url).toBe('/opportunities/opportunity-9/brief')
  })

  it('names the organisation behind something they joined', async () => {
    const view = await build([makeEntry()]).bySlug('amara-mensah')

    expect(view.entries[0].opportunity.organiser).toBe('Green Neighbourhood')
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
