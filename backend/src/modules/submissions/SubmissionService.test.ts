import { describe, expect, it } from 'vitest'
import { ConflictError, ForbiddenError } from '../../core/errors/HttpErrors'
import type { ApplicationRecord, ApplicationStore } from '../applications/ApplicationStore'
import type { OpportunityRecord, OpportunityStore } from '../opportunities/OpportunityStore'
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

class FakeOpportunityStore implements OpportunityStore {
  async create(): Promise<never> {
    throw new Error('not needed in this test')
  }

  async findPublished() {
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

  async reject(id: string) {
    const record = this.records.find(entry => entry.id === id)!
    record.status = 'REJECTED'
    return record
  }

  async approveAndCredit(id: string, hours: number, skills: string[]) {
    this.credited = { hours, skills }
    const record = this.records.find(entry => entry.id === id)!
    record.status = 'APPROVED'
    return record
  }
}

function build(records: SubmissionRecord[] = [], accepted = ['volunteer-1']) {
  const submissions = new FakeSubmissionStore(records)
  const service = new SubmissionService(
    submissions,
    new FakeApplicationStore(accepted),
    new FakeOpportunityStore(),
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

describe('reviewing hours', () => {
  it('credits the portfolio on approval', async () => {
    const { service, submissions } = build([makeSubmission()])
    const view = await service.decide(organiser, 'submission-1', 'APPROVE')

    expect(view.status).toBe('APPROVED')
    expect(submissions.credited).toEqual({ hours: 4, skills: ['Graphic design'] })
  })

  it('credits nothing on rejection', async () => {
    const { service, submissions } = build([makeSubmission()])
    const view = await service.decide(organiser, 'submission-1', 'REJECT')

    expect(view.status).toBe('REJECTED')
    expect(submissions.credited).toBeNull()
  })

  it('stops anyone but the organiser reviewing', async () => {
    const { service } = build([makeSubmission()])

    await expect(service.decide(outsider, 'submission-1', 'APPROVE')).rejects.toThrow(ForbiddenError)
  })

  it('refuses to review the same hours twice', async () => {
    const { service } = build([makeSubmission({ status: 'APPROVED' })])

    await expect(service.decide(organiser, 'submission-1', 'REJECT')).rejects.toThrow(ConflictError)
  })

  it('reports hours that do not exist', async () => {
    const { service } = build()

    await expect(service.decide(organiser, 'nope', 'APPROVE')).rejects.toThrow('do not exist')
  })
})
