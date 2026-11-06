import { describe, expect, it } from 'vitest'
import { ConflictError, ForbiddenError } from '../../core/errors/HttpErrors'
import type {
  FeedFilter,
  NewOpportunity,
  OpportunityRecord,
  OpportunityStore,
} from '../opportunities/OpportunityStore'
import type { Notifier } from '../notifications/Notifier'
import { ApplicationService } from './ApplicationService'
import type {
  ApplicationRecord,
  ApplicationStore,
  NewApplication,
} from './ApplicationStore'

const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

const volunteer = { userId: 'volunteer-1', role: 'VOLUNTEER' }
const otherVolunteer = { userId: 'volunteer-2', role: 'VOLUNTEER' }
const organiser = { userId: 'organisation-1', role: 'ORGANISATION' }

const draft: NewApplication = {
  motivationStatement: 'I live two streets away and I can bring my own gardening tools.',
  resumeUrl: null,
}

function makeOpportunity(overrides: Partial<OpportunityRecord> = {}): OpportunityRecord {
  return {
    id: 'opportunity-1',
    creatorId: 'organisation-1',
    title: 'Restore the wetland path',
    description: 'Plant trees and clear the path with the neighbourhood team.',
    mode: 'PHYSICAL',
    location: 'Kimironko',
    sector: 'Kimironko',
    maxCapacity: 2,
    applicationDeadline: tomorrow,
    startsAt: tomorrow,
    endsAt: tomorrow,
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

function makeApplication(overrides: Partial<ApplicationRecord> = {}): ApplicationRecord {
  return {
    id: 'application-1',
    opportunityId: 'opportunity-1',
    volunteerId: 'volunteer-1',
    motivationStatement: draft.motivationStatement,
    resumeUrl: null,
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    volunteer: {
      id: 'volunteer-1',
      name: 'Amara Mensah',
      email: 'amara@example.com',
      avatar: null,
      bio: null,
      profile: {
        portfolioSlug: 'amara-mensah',
        skills: [],
        interests: [],
        availabilitySlots: [],
        location: null,
      },
    },
    opportunity: {
      id: 'opportunity-1',
      title: 'Restore the wetland path',
      creatorId: 'organisation-1',
      maxCapacity: 2,
      applicationDeadline: tomorrow,
      mode: 'PHYSICAL',
      requiredSkills: [],
      categories: [],
    },
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
  constructor(private readonly opportunity: OpportunityRecord | null) {}

  async create(_creatorId: string, _status: string, _input: NewOpportunity): Promise<never> {
    throw new Error('not needed in this test')
  }

  async findPublished(_filter: FeedFilter) {
    return []
  }

  async findBrief() {
    return null
  }

  async findSince() {
    return []
  }

  async findById() {
    return this.opportunity
  }

  async findCreatedBy() {
    return []
  }

  async findAwaitingApproval() {
    return []
  }

  async countWorkload() {
    return []
  }

  async countActivity() {
    return { applications: 0, deliverables: 0, credited: 0 }
  }

  async update(): Promise<never> {
    throw new Error('not needed in this test')
  }

  async updateStatus(): Promise<never> {
    throw new Error('not needed in this test')
  }

  async closeApplications(): Promise<never> {
    throw new Error('not needed in this test')
  }

  async remove(): Promise<void> {
    throw new Error('not needed in this test')
  }

  async setQrToken() {}
}

class FakeApplicationStore implements ApplicationStore {
  accepted = 0

  constructor(
    private readonly existing: ApplicationRecord[] = [],
    private readonly capacityTaken = 0,
  ) {
    this.accepted = capacityTaken
  }

  async create(opportunityId: string, volunteerId: string, input: NewApplication) {
    return makeApplication({ opportunityId, volunteerId, ...input })
  }

  async findById(id: string) {
    return this.existing.find(record => record.id === id) ?? null
  }

  async findByVolunteer(volunteerId: string) {
    return this.existing.filter(record => record.volunteerId === volunteerId)
  }

  async findForOpportunity(opportunityId: string) {
    return this.existing.filter(record => record.opportunityId === opportunityId)
  }

  async findAccepted(opportunityId: string, volunteerId: string) {
    return (
      this.existing.find(
        record =>
          record.opportunityId === opportunityId &&
          record.volunteerId === volunteerId &&
          record.status === 'ACCEPTED',
      ) ?? null
    )
  }

  async acceptIfSpace(applicationId: string, _opportunityId: string, maxCapacity: number) {
    if (this.accepted >= maxCapacity) return null

    this.accepted += 1

    return makeApplication({ id: applicationId, status: 'ACCEPTED' })
  }

  async updateStatus(id: string, status: string) {
    return makeApplication({ id, status: status as ApplicationRecord['status'] })
  }
}

const notifier = new RecordingNotifier()

function buildService(
  applications: FakeApplicationStore,
  opportunity: OpportunityRecord | null = makeOpportunity(),
) {
  return new ApplicationService(applications, new FakeOpportunityStore(opportunity), notifier)
}

describe('applying', () => {
  it('accepts a volunteer application', async () => {
    const view = await buildService(new FakeApplicationStore()).apply(
      volunteer,
      'opportunity-1',
      draft,
    )

    expect(view.status).toBe('PENDING')
  })

  it('refuses an organisation', async () => {
    const service = buildService(new FakeApplicationStore())

    await expect(service.apply(organiser, 'opportunity-1', draft)).rejects.toThrow(ForbiddenError)
  })

  it('refuses the organiser of that same opportunity', async () => {
    const opportunity = makeOpportunity({ creatorId: 'volunteer-1' })
    const service = buildService(new FakeApplicationStore(), opportunity)

    await expect(service.apply(volunteer, 'opportunity-1', draft)).rejects.toThrow(
      'You cannot apply to your own opportunity',
    )
  })

  it('refuses one that is still awaiting approval', async () => {
    const opportunity = makeOpportunity({ status: 'PENDING_APPROVAL' })
    const service = buildService(new FakeApplicationStore(), opportunity)

    await expect(service.apply(volunteer, 'opportunity-1', draft)).rejects.toThrow(ConflictError)
  })

  it('refuses one whose deadline has passed', async () => {
    const opportunity = makeOpportunity({ applicationDeadline: yesterday })
    const service = buildService(new FakeApplicationStore(), opportunity)

    await expect(service.apply(volunteer, 'opportunity-1', draft)).rejects.toThrow(
      'The deadline for that opportunity has passed',
    )
  })

  it('reports an opportunity that does not exist', async () => {
    const service = buildService(new FakeApplicationStore(), null)

    await expect(service.apply(volunteer, 'nope', draft)).rejects.toThrow('does not exist')
  })
})

describe('deciding on an application', () => {
  it('accepts while there is room', async () => {
    const store = new FakeApplicationStore([makeApplication()], 1)
    const view = await buildService(store).decide(organiser, 'application-1', 'ACCEPT')

    expect(view.status).toBe('ACCEPTED')
  })

  it('refuses to overfill the opportunity', async () => {
    const store = new FakeApplicationStore([makeApplication()], 2)
    const service = buildService(store)

    await expect(service.decide(organiser, 'application-1', 'ACCEPT')).rejects.toThrow(
      'Every place on that opportunity is taken',
    )
  })

  it('rejects without touching capacity', async () => {
    const store = new FakeApplicationStore([makeApplication()], 2)
    const view = await buildService(store).decide(organiser, 'application-1', 'REJECT')

    expect(view.status).toBe('REJECTED')
    expect(store.accepted).toBe(2)
  })

  it('stops anyone but the organiser deciding', async () => {
    const store = new FakeApplicationStore([makeApplication()])
    const service = buildService(store)

    await expect(service.decide(otherVolunteer, 'application-1', 'ACCEPT')).rejects.toThrow(
      ForbiddenError,
    )
  })

  it('refuses to decide the same application twice', async () => {
    const store = new FakeApplicationStore([makeApplication({ status: 'ACCEPTED' })])
    const service = buildService(store)

    await expect(service.decide(organiser, 'application-1', 'REJECT')).rejects.toThrow(
      'already been decided',
    )
  })
})

describe('telling people what happened', () => {
  it('tells the organiser when someone applies', async () => {
    notifier.sent = []

    await buildService(new FakeApplicationStore()).apply(volunteer, 'opportunity-1', draft)

    expect(notifier.sent[0].userId).toBe('organisation-1')
    expect(notifier.sent[0].message).toContain('applied')
  })

  it('tells the volunteer when they get a place', async () => {
    const store = new FakeApplicationStore([makeApplication()], 1)
    notifier.sent = []

    await buildService(store).decide(organiser, 'application-1', 'ACCEPT')

    expect(notifier.sent[0].userId).toBe('volunteer-1')
    expect(notifier.sent[0].message).toContain('place')
  })
})

describe('withdrawing', () => {
  it('lets the applicant pull out', async () => {
    const store = new FakeApplicationStore([makeApplication()])
    const view = await buildService(store).withdraw(volunteer, 'application-1')

    expect(view.status).toBe('WITHDRAWN')
  })

  it('stops someone withdrawing another volunteer application', async () => {
    const store = new FakeApplicationStore([makeApplication()])
    const service = buildService(store)

    await expect(service.withdraw(otherVolunteer, 'application-1')).rejects.toThrow(ForbiddenError)
  })

  it('refuses when it was already rejected', async () => {
    const store = new FakeApplicationStore([makeApplication({ status: 'REJECTED' })])
    const service = buildService(store)

    await expect(service.withdraw(volunteer, 'application-1')).rejects.toThrow('already closed')
  })
})

describe('listing', () => {
  it('shows the organiser who applied', async () => {
    const store = new FakeApplicationStore([makeApplication()])
    const list = await buildService(store).forOpportunity(organiser, 'opportunity-1')

    expect(list).toHaveLength(1)
    expect(list[0].volunteer.name).toBe('Amara Mensah')
  })

  it('scores each applicant against what the opportunity asks for', async () => {
    const opportunity = makeOpportunity({
      requiredSkills: ['Graphic design'],
      categories: ['Education'],
    })
    const store = new FakeApplicationStore([
      makeApplication({
        volunteer: {
          id: 'volunteer-1',
          name: 'Amara Mensah',
          email: 'amara@example.com',
          avatar: null,
          bio: null,
          profile: {
            portfolioSlug: 'amara-mensah',
            skills: ['Graphic design'],
            interests: ['Education'],
            availabilitySlots: [],
            location: null,
          },
        },
        opportunity: {
          id: 'opportunity-1',
          title: 'Restore the wetland path',
          creatorId: 'organisation-1',
          maxCapacity: 2,
          applicationDeadline: tomorrow,
          mode: 'PHYSICAL',
          requiredSkills: ['Graphic design'],
          categories: ['Education'],
        },
      }),
    ])

    const list = await buildService(store, opportunity).forOpportunity(organiser, 'opportunity-1')

    expect(list[0].match.score).toBe(100)
    expect(list[0].match.sharedSkills).toEqual(['Graphic design'])
  })

  it('puts the best fit first', async () => {
    const tags = (skills: string[]) => ({
      id: 'volunteer-1',
      name: skills.length > 0 ? 'Fits well' : 'Fits badly',
      email: 'someone@example.com',
      avatar: null,
      bio: null,
      profile: {
        portfolioSlug: 'someone',
        skills,
        interests: [],
        availabilitySlots: [],
        location: null,
      },
    })

    const asked = {
      id: 'opportunity-1',
      title: 'Restore the wetland path',
      creatorId: 'organisation-1',
      maxCapacity: 2,
      applicationDeadline: tomorrow,
      mode: 'PHYSICAL' as const,
      requiredSkills: ['First aid'],
      categories: [],
    }

    const store = new FakeApplicationStore([
      makeApplication({ id: 'weak', volunteer: tags([]), opportunity: asked }),
      makeApplication({ id: 'strong', volunteer: tags(['First aid']), opportunity: asked }),
    ])

    const list = await buildService(store).forOpportunity(organiser, 'opportunity-1')

    expect(list.map(entry => entry.id)).toEqual(['strong', 'weak'])
  })

  it('hides the list from another volunteer', async () => {
    const store = new FakeApplicationStore([makeApplication()])
    const service = buildService(store)

    await expect(service.forOpportunity(otherVolunteer, 'opportunity-1')).rejects.toThrow(
      ForbiddenError,
    )
  })
})
