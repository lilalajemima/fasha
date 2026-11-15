import type { User } from '@prisma/client'
import { describe, expect, it } from 'vitest'
import { ConflictError, ForbiddenError } from '../../core/errors/HttpErrors'
import { MatchingService } from '../matching/MatchingService'
import type { Notifier } from '../notifications/Notifier'
import { OpportunityService } from './OpportunityService'
import type {
  BriefFile,
  FeedFilter,
  NewOpportunity,
  OpportunityRecord,
  OpportunityStore,
} from './OpportunityStore'
import type { NewAccount, UserStore, UserWithProfile } from '../auth/UserStore'

const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
const later = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)

function makeRecord(overrides: Partial<OpportunityRecord> = {}): OpportunityRecord {
  return {
    id: 'opportunity-1',
    creatorId: 'organisation-1',
    title: 'Restore the wetland path',
    description: 'Plant trees and clear the path with the neighbourhood team.',
    mode: 'PHYSICAL',
    location: 'Kimironko',
    sector: 'Kimironko',
    maxCapacity: 20,
    applicationDeadline: new Date(later.getTime() + 86400000),
    startsAt: nextWeek,
    endsAt: later,
    status: 'PUBLISHED',
    reviewNote: null,
    reviewedAt: null,
    qrToken: null,
    requiredSkills: [],
    categories: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    creator: { id: 'organisation-1', name: 'Green Neighbourhood', role: 'ORGANISATION' },
    brief: null,
    ...overrides,
  }
}

class RecordingNotifier implements Notifier {
  sent: { userId: string; type: string; message: string }[] = []

  async send(userId: string, type: string, message: string) {
    this.sent.push({ userId, type, message })
  }
}

class FakeOpportunityStore implements OpportunityStore {
  // How many people have applied, which decides whether it can be deleted.
  applications = 0
  readonly briefs = new Map<string, BriefFile>()

  constructor(private readonly records: OpportunityRecord[] = []) { }

  async create(creatorId: string, status: string, input: NewOpportunity) {
    const record = makeRecord({
      ...input,
      creatorId,
      status: status as OpportunityRecord['status'],
    })
    this.records.push(record)
    return record
  }

  async findPublished(_filter: FeedFilter) {
    return this.records.filter(record => record.status === 'PUBLISHED')
  }

  async findBrief(id: string) {
    return this.briefs.get(id) ?? null
  }

  async findSince() {
    return this.records
  }

  async findById(id: string) {
    return this.records.find(record => record.id === id) ?? null
  }

  async findCreatedBy(creatorId: string) {
    return this.records.filter(record => record.creatorId === creatorId)
  }

  async findAwaitingApproval() {
    return this.records.filter(record => record.status === 'PENDING_APPROVAL')
  }

  async updateStatus(id: string, status: string, reviewNote: string | null) {
    const record = this.records.find(entry => entry.id === id)!
    record.status = status as OpportunityRecord['status']
    record.reviewNote = reviewNote
    return record
  }

  async update(id: string, input: NewOpportunity, status: string) {
    const record = this.records.find(entry => entry.id === id)!
    Object.assign(record, input, { status: status as OpportunityRecord['status'] })
    return record
  }

  async closeApplications(id: string, at: Date) {
    const record = this.records.find(entry => entry.id === id)!
    record.applicationDeadline = at
    return record
  }

  async remove(id: string) {
    const at = this.records.findIndex(entry => entry.id === id)
    this.records.splice(at, 1)
  }

  async countActivity() {
    return { applications: this.applications, deliverables: 0, credited: 0 }
  }

  async countWorkload() {
    return []
  }

  async setQrToken() { }
}

class FakeUserStore implements UserStore {
  constructor(private readonly skills: string[] = [], private readonly interests: string[] = []) { }

  async findByEmail() {
    return null
  }

  async findById() {
    return null
  }

  async findWithProfile() {
    return {
      profile: { skills: this.skills, interests: this.interests },
    } as unknown as UserWithProfile
  }

  async createVolunteer(_account: NewAccount, _portfolioSlug: string): Promise<User> {
    throw new Error('not needed in this test')
  }

  async createOrganisation(_account: NewAccount): Promise<User> {
    throw new Error('not needed in this test')
  }

  async updateAccount() {
    throw new Error('not needed in this test')
  }

  async findByGoogleId() {
    return null
  }

  async linkGoogle() {}
}

const draft: NewOpportunity = {
  title: 'Saturday food parcels',
  description: 'Sort donations and prepare parcels for families nearby.',
  mode: 'PHYSICAL',
  location: 'Kimironko market',
  sector: 'Kimironko',
  maxCapacity: 12,
  applicationDeadline: tomorrow,
  startsAt: nextWeek,
  endsAt: later,
  requiredSkills: ['Teamwork'],
  categories: ['Food access'],
}

const notifier = new RecordingNotifier()

function citizenProposal(overrides: Partial<OpportunityRecord> = {}): OpportunityRecord {
  return makeRecord({
    id: 'proposal',
    status: 'PENDING_APPROVAL',
    creatorId: 'volunteer-1',
    creator: { id: 'volunteer-1', name: 'Amara Mensah', role: 'VOLUNTEER' },
    brief: null,
    ...overrides,
  })
}

function buildService(records: OpportunityRecord[] = [], users = new FakeUserStore()) {
  return new OpportunityService(
    new FakeOpportunityStore(records),
    users,
    new MatchingService(),
    notifier,
  )
}

describe('creating an opportunity', () => {
  it('publishes an organisation post straight away', async () => {
    const view = await buildService().create({ userId: 'organisation-1', role: 'ORGANISATION' }, draft)

    expect(view.status).toBe('PUBLISHED')
  })

  it('holds a volunteer post for approval', async () => {
    const view = await buildService().create({ userId: 'volunteer-1', role: 'VOLUNTEER' }, draft)

    expect(view.status).toBe('PENDING_APPROVAL')
  })

  it('refuses a physical opportunity with no start time', async () => {
    const service = buildService()

    await expect(
      service.create({ userId: 'organisation-1', role: 'ORGANISATION' }, { ...draft, startsAt: null }),
    ).rejects.toThrow('needs a start time')
  })

  it('refuses one that finishes before it starts', async () => {
    const service = buildService()

    await expect(
      service.create({ userId: 'organisation-1', role: 'ORGANISATION' }, {
        ...draft,
        startsAt: later,
        endsAt: nextWeek,
      }),
    ).rejects.toThrow('finish after it starts')
  })

  it('refuses applications that close after the work is over', async () => {
    const service = buildService()

    await expect(
      service.create({ userId: 'organisation-1', role: 'ORGANISATION' }, {
        ...draft,
        applicationDeadline: new Date(later.getTime() + 86400000),
        startsAt: nextWeek,
        endsAt: later,
      }),
    ).rejects.toThrow('cannot close after the work is over')
  })

  it('refuses a physical opportunity with no location', async () => {
    const service = buildService()

    await expect(
      service.create({ userId: 'organisation-1', role: 'ORGANISATION' }, { ...draft, location: null }),
    ).rejects.toThrow('A physical opportunity needs a location')
  })
})

describe('the feed', () => {
  const records = [
    makeRecord({ id: 'mismatch', requiredSkills: ['Plumbing'], categories: ['Sport'] }),
    makeRecord({ id: 'match', requiredSkills: ['Teamwork'], categories: ['Environment'] }),
  ]

  it('puts the best match first for a volunteer', async () => {
    const users = new FakeUserStore(['Teamwork'], ['Environment'])
    const feed = await buildService(records, users).feed({ userId: 'volunteer-1', role: 'VOLUNTEER' }, {
      search: null,
      mode: null,
      sector: null,
    })

    expect(feed.map(view => view.id)).toEqual(['match', 'mismatch'])
    expect(feed[0].matchScore).toBe(100)
  })

  it('leaves out the score for an organisation', async () => {
    const feed = await buildService(records).feed({ userId: 'organisation-1', role: 'ORGANISATION' }, {
      search: null,
      mode: null,
      sector: null,
    })

    expect(feed[0].matchScore).toBeUndefined()
  })
})

describe('reviewing a volunteer proposal', () => {
  it('publishes it when approved', async () => {
    const records = [citizenProposal()]
    const view = await buildService(records).decide('proposal', 'APPROVE')

    expect(view.status).toBe('PUBLISHED')
  })

  it('rejects it when turned down', async () => {
    const records = [citizenProposal()]
    const view = await buildService(records).decide('proposal', 'REJECT', 'Please add a date.')

    expect(view.status).toBe('REJECTED')
    expect(view.reviewNote).toBe('Please add a date.')
  })

  it('refuses to review the same proposal twice', async () => {
    const records = [citizenProposal()]
    const service = buildService(records)

    await service.decide('proposal', 'APPROVE')

    await expect(service.decide('proposal', 'APPROVE')).rejects.toThrow(ConflictError)
  })

  it('refuses to review a post an organisation made', async () => {
    const records = [makeRecord({ id: 'proposal', status: 'PENDING_APPROVAL' })]

    await expect(buildService(records).decide('proposal', 'APPROVE')).rejects.toThrow(
      'Only citizen initiatives go through review',
    )
  })

  it('reports a missing opportunity', async () => {
    await expect(buildService().decide('nope', 'APPROVE')).rejects.toThrow('does not exist')
  })

  it('tells the person who proposed it', async () => {
    const records = [citizenProposal({ creatorId: 'volunteer-9' })]
    notifier.sent = []

    await buildService(records).decide('proposal', 'APPROVE')

    expect(notifier.sent).toHaveLength(1)
    expect(notifier.sent[0].userId).toBe('volunteer-9')
    expect(notifier.sent[0].message).toContain('approved')
  })
})

describe('the oversight calendar', () => {
  it('gives the community admin everything, whatever its state', async () => {
    const list = await buildService([
      makeRecord(),
      makeRecord({ id: 'opportunity-2', status: 'PENDING_APPROVAL' }),
    ]).everything({ userId: 'admin-1', role: 'ADMIN' }, 12)

    expect(list.map(entry => entry.status)).toEqual(['PUBLISHED', 'PENDING_APPROVAL'])
  })

  it('is refused to an organiser', async () => {
    await expect(
      buildService([makeRecord()]).everything({ userId: 'organisation-1', role: 'ORGANISATION' }, 12),
    ).rejects.toThrow(ForbiddenError)
  })
})

describe('changing an initiative after it is posted', () => {
  const owner = { userId: 'volunteer-1', role: 'VOLUNTEER' }

  it('refuses an edit from somebody who did not create it', async () => {
    const records = [citizenProposal()]

    await expect(
      buildService(records).update({ userId: 'volunteer-2', role: 'VOLUNTEER' }, 'proposal', draft),
    ).rejects.toThrow('belongs to somebody else')
  })

  it('sends a rejected proposal back for review when it is fixed', async () => {
    const records = [citizenProposal({ status: 'REJECTED', reviewNote: 'Please add a date.' })]

    const view = await buildService(records).update(owner, 'proposal', draft)

    expect(view.status).toBe('PENDING_APPROVAL')
  })

  it('refuses an edit once applications have closed', async () => {
    const records = [
      citizenProposal({ status: 'PUBLISHED', applicationDeadline: new Date(Date.now() - 1000) }),
    ]

    await expect(buildService(records).update(owner, 'proposal', draft)).rejects.toThrow(
      'can no longer be edited',
    )
  })

  it('deletes one nobody has touched', async () => {
    const records = [citizenProposal()]
    const service = buildService(records)

    await service.remove(owner, 'proposal')

    await expect(service.detail(owner, 'proposal')).rejects.toThrow('does not exist')
  })

  it('refuses to delete one people have applied to', async () => {
    const store = new FakeOpportunityStore([citizenProposal()])
    store.applications = 1
    const service = new OpportunityService(store, new FakeUserStore(), new MatchingService(), notifier)

    await expect(service.remove(owner, 'proposal')).rejects.toThrow('Close it early instead')
  })

  it('closes applications early', async () => {
    const records = [citizenProposal({ status: 'PUBLISHED' })]

    const view = await buildService(records).closeEarly(owner, 'proposal')

    expect(new Date(view.applicationDeadline).getTime()).toBeLessThanOrEqual(Date.now())
  })
})
describe('reading the PDF brief', () => {
  const plan = { name: 'plan.pdf', data: 'JVBERi0xLjQK' }

  function withBrief(record: OpportunityRecord) {
    const store = new FakeOpportunityStore([record])

    store.briefs.set(record.id, plan)

    return new OpportunityService(store, new FakeUserStore(), new MatchingService(), notifier)
  }

  it('lets anybody read the brief of something published, signed in or not', async () => {
    const service = withBrief(makeRecord())

    await expect(service.brief(undefined, 'opportunity-1')).resolves.toEqual(plan)
    await expect(service.brief({ userId: 'volunteer-9', role: 'VOLUNTEER' }, 'opportunity-1')).resolves.toEqual(plan)
  })

  it('keeps the brief of an unpublished proposal from strangers', async () => {
    const service = withBrief(citizenProposal())

    await expect(service.brief(undefined, 'proposal')).rejects.toThrow(ForbiddenError)
    await expect(service.brief({ userId: 'volunteer-9', role: 'VOLUNTEER' }, 'proposal')).rejects.toThrow(ForbiddenError)
    await expect(service.brief({ userId: 'organisation-1', role: 'ORGANISATION' }, 'proposal')).rejects.toThrow(ForbiddenError)
  })

  it('shows it to the person who proposed it and to the admin reviewing it', async () => {
    const service = withBrief(citizenProposal())

    await expect(service.brief({ userId: 'volunteer-1', role: 'VOLUNTEER' }, 'proposal')).resolves.toEqual(plan)
    await expect(service.brief({ userId: 'admin-1', role: 'ADMIN' }, 'proposal')).resolves.toEqual(plan)
  })

  it('says so when there is no brief', async () => {
    await expect(buildService([makeRecord()]).brief(undefined, 'opportunity-1')).rejects.toThrow('has no brief')
  })
})

describe('lists for one person', () => {
  it('shows an organiser only what they created', async () => {
    const records = [
      makeRecord({ id: 'mine', creatorId: 'organisation-1' }),
      makeRecord({ id: 'theirs', creatorId: 'organisation-2' }),
    ]

    const views = await buildService(records).createdBy({ userId: 'organisation-1', role: 'ORGANISATION' })

    expect(views.map(view => view.id)).toEqual(['mine'])
  })

  it('puts only proposals still waiting in the approval queue', async () => {
    const records = [
      citizenProposal({ id: 'waiting' }),
      citizenProposal({ id: 'approved', status: 'PUBLISHED' }),
      citizenProposal({ id: 'turned-down', status: 'REJECTED' }),
    ]

    const views = await buildService(records).awaitingApproval()

    expect(views.map(view => view.id)).toEqual(['waiting'])
  })
})
