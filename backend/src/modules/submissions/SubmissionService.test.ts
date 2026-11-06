import { describe, expect, it } from 'vitest'
import { BadRequestError, ConflictError, ForbiddenError } from '../../core/errors/HttpErrors'
import type { ApplicationRecord, ApplicationStore } from '../applications/ApplicationStore'
import type { OpportunityRecord, OpportunityStore } from '../opportunities/OpportunityStore'
import type { Notifier } from '../notifications/Notifier'
import { SubmissionService } from './SubmissionService'
import type { NewSubmission, SubmissionRecord, SubmissionStore } from './SubmissionStore'

const volunteer = { userId: 'volunteer-1', role: 'VOLUNTEER' }
const organiser = { userId: 'organisation-1', role: 'ORGANISATION' }
const outsider = { userId: 'volunteer-2', role: 'VOLUNTEER' }

const draft: NewSubmission = { hoursClaimed: 4, proofUrl: 'https://example.com/proof.jpg' }

function makeSubmission(overrides: Partial<SubmissionRecord> = {}): SubmissionRecord {
  return {
    id: 'submission-1',
    opportunityId: 'opportunity-1',
    volunteerId: 'volunteer-1',
    hoursClaimed: 4,
    proofUrl: 'https://example.com/proof.jpg',
    status: 'PENDING',
    reviewNote: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    volunteer: { id: 'volunteer-1', name: 'Amara Mensah' },
    opportunity: {
      id: 'opportunity-1',
      title: 'Design a reading guide',
      creatorId: 'organisation-1',
      requiredSkills: ['Graphic design'],
    },
    ...overrides,
  }
}

class FakeApplicationStore implements ApplicationStore {
  constructor(private readonly accepted: string[] = ['volunteer-1']) {}

  async create(): Promise<never> {
    throw new Error('not needed in this test')
  }

  async findById() {
    return null
  }

  async findByVolunteer() {
    return []
  }

  async findForOpportunity() {
    return []
  }

  async findAccepted(_opportunityId: string, volunteerId: string) {
    return this.accepted.includes(volunteerId)
      ? ({ id: 'application-1' } as unknown as ApplicationRecord)
      : null
  }

  async acceptIfSpace() {
    return null
  }

  async updateStatus(): Promise<never> {
    throw new Error('not needed in this test')
  }
}

class RecordingNotifier implements Notifier {
  sent: { userId: string; type: string; message: string }[] = []

  async send(userId: string, type: string, message: string) {
    this.sent.push({ userId, type, message })
  }
}

class FakeOpportunityStore implements OpportunityStore {
  async create(): Promise<never> {
    throw new Error('not needed in this test')
  }

  async findPublished() {
    return []
  }

  async findBrief() {
    return null
  }

  async findSince() {
    return []
  }

  async findById() {
    return { id: 'opportunity-1', creatorId: 'organisation-1' } as unknown as OpportunityRecord
  }

  async findCreatedBy() {
    return []
  }

  async findAwaitingApproval() {
    return []
  }

  async updateStatus(): Promise<never> {
    throw new Error('not needed in this test')
  }

  async setQrToken() {}
}

class FakeSubmissionStore implements SubmissionStore {
  credited: { hours: number; skills: string[] } | null = null

  constructor(private readonly records: SubmissionRecord[] = []) {}

  async create(opportunityId: string, volunteerId: string, input: NewSubmission) {
    const record = makeSubmission({ opportunityId, volunteerId, ...input })
    this.records.push(record)
    return record
  }

  async findById(id: string) {
    return this.records.find(record => record.id === id) ?? null
  }

  async findByVolunteer(volunteerId: string) {
    return this.records.filter(record => record.volunteerId === volunteerId)
  }

  async findForOpportunity(opportunityId: string) {
    return this.records.filter(record => record.opportunityId === opportunityId)
  }

  async findForCreator(creatorId: string) {
    return this.records.filter(record => record.opportunity.creatorId === creatorId)
  }

  async findOpen(opportunityId: string, volunteerId: string) {
    return (
      this.records.find(
        record =>
          record.opportunityId === opportunityId &&
          record.volunteerId === volunteerId &&
          record.status !== 'REJECTED',
      ) ?? null
    )
  }

  async reject(id: string, reviewNote: string) {
    const record = this.records.find(entry => entry.id === id)!
    record.status = 'REJECTED'
    record.reviewNote = reviewNote
    return record
  }

  async approveAndCredit(id: string, hours: number, skills: string[]) {
    this.credited = { hours, skills }
    const record = this.records.find(entry => entry.id === id)!
    record.status = 'APPROVED'
    return record
  }
}

const notifier = new RecordingNotifier()

function build(records: SubmissionRecord[] = [], accepted = ['volunteer-1']) {
  const submissions = new FakeSubmissionStore(records)
  const service = new SubmissionService(
    submissions,
    new FakeApplicationStore(accepted),
    new FakeOpportunityStore(),
    notifier,
  )

  return { service, submissions }
}

describe('submitting hours', () => {
  it('records what the volunteer claims', async () => {
    const { service } = build()
    const view = await service.submit(volunteer, 'opportunity-1', draft)

    expect(view.status).toBe('PENDING')
    expect(view.hoursClaimed).toBe(4)
  })

  it('refuses a volunteer with no accepted place', async () => {
    const { service } = build([], [])

    await expect(service.submit(volunteer, 'opportunity-1', draft)).rejects.toThrow(ForbiddenError)
  })

  it('refuses an organisation', async () => {
    const { service } = build()

    await expect(service.submit(organiser, 'opportunity-1', draft)).rejects.toThrow(ForbiddenError)
  })

  it('refuses a second claim while one is waiting', async () => {
    const { service } = build([makeSubmission()])

    await expect(service.submit(volunteer, 'opportunity-1', draft)).rejects.toThrow(ConflictError)
  })

  it('allows a fresh claim after one was rejected', async () => {
    const { service } = build([makeSubmission({ status: 'REJECTED' })])

    expect((await service.submit(volunteer, 'opportunity-1', draft)).status).toBe('PENDING')
  })
})

describe('listing hours for an opportunity', () => {
  it('shows the organiser every claim', async () => {
    const { service } = build([makeSubmission()])

    expect(await service.forOpportunity(organiser, 'opportunity-1')).toHaveLength(1)
  })

  it('hides them from another volunteer', async () => {
    const { service } = build([makeSubmission()])

    await expect(service.forOpportunity(outsider, 'opportunity-1')).rejects.toThrow(ForbiddenError)
  })
})

describe('listing everything sent to one organiser', () => {
  it('gathers the claims across their opportunities', async () => {
    const { service } = build([
      makeSubmission({ id: 'one' }),
      makeSubmission({
        id: 'two',
        opportunityId: 'opportunity-2',
        opportunity: {
          id: 'opportunity-2',
          title: 'Translate the health leaflets',
          creatorId: 'organisation-1',
          requiredSkills: [],
        },
      }),
    ])

    const list = await service.received(organiser)

    expect(list.map(entry => entry.opportunity.title)).toEqual([
      'Design a reading guide',
      'Translate the health leaflets',
    ])
  })

  it('leaves out other people opportunities', async () => {
    const { service } = build([
      makeSubmission({
        opportunity: {
          id: 'opportunity-9',
          title: 'Someone else work',
          creatorId: 'organisation-2',
          requiredSkills: [],
        },
      }),
    ])

    expect(await service.received(organiser)).toHaveLength(0)
  })
})

describe('reviewing hours', () => {
  it('credits the portfolio on approval', async () => {
    const { service, submissions } = build([makeSubmission()])
    const view = await service.decide(organiser, 'submission-1', 'APPROVE', null)

    expect(view.status).toBe('APPROVED')
    expect(submissions.credited).toEqual({ hours: 4, skills: ['Graphic design'] })
  })

  it('credits nothing on rejection', async () => {
    const { service, submissions } = build([makeSubmission()])
    const view = await service.decide(
      organiser,
      'submission-1',
      'REJECT',
      'The photograph does not show the finished wall.',
    )

    expect(view.status).toBe('REJECTED')
    expect(view.reviewNote).toBe('The photograph does not show the finished wall.')
    expect(submissions.credited).toBeNull()
  })

  it('stops anyone but the organiser reviewing', async () => {
    const { service } = build([makeSubmission()])

    await expect(service.decide(outsider, 'submission-1', 'APPROVE', null)).rejects.toThrow(ForbiddenError)
  })

  it('refuses to review the same hours twice', async () => {
    const { service } = build([makeSubmission({ status: 'APPROVED' })])

    await expect(
      service.decide(organiser, 'submission-1', 'REJECT', 'Already looked at this one.'),
    ).rejects.toThrow(ConflictError)
  })

  it('tells the volunteer their hours were credited', async () => {
    const { service } = build([makeSubmission()])
    notifier.sent = []

    await service.decide(organiser, 'submission-1', 'APPROVE', null)

    expect(notifier.sent[0].userId).toBe('volunteer-1')
    expect(notifier.sent[0].message).toContain('portfolio')
  })

  it('refuses a rejection with no reason', async () => {
    const { service, submissions } = build([makeSubmission()])

    await expect(service.decide(organiser, 'submission-1', 'REJECT', null)).rejects.toThrow(
      'Say why the hours were not approved',
    )
    await expect(service.decide(organiser, 'submission-1', 'REJECT', 'no')).rejects.toThrow(
      BadRequestError,
    )
    expect(submissions.credited).toBeNull()
  })

  it('sends the reason to the volunteer', async () => {
    const { service } = build([makeSubmission()])
    notifier.sent = []

    await service.decide(organiser, 'submission-1', 'REJECT', 'The hours are more than the event ran for.')

    expect(notifier.sent[0].userId).toBe('volunteer-1')
    expect(notifier.sent[0].message).toContain('more than the event ran for')
  })

  it('reports hours that do not exist', async () => {
    const { service } = build()

    await expect(service.decide(organiser, 'nope', 'APPROVE', null)).rejects.toThrow('do not exist')
  })
})
