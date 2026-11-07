import { describe, expect, it } from 'vitest'
import type { UserStore, UserWithProfile } from '../auth/UserStore'
import { MatchingService } from '../matching/MatchingService'
import type { Notifier } from '../notifications/Notifier'
import { OpportunityService } from './OpportunityService'
import type { OpportunityRecord, OpportunityStore, WorkloadRow } from './OpportunityStore'

class CountingStore implements OpportunityStore {
  readonly asked: string[] = []
  private readonly rows: WorkloadRow[]

  constructor(rows: WorkloadRow[] = []) {
    this.rows = rows
  }

  async countWorkload(creatorId: string): Promise<WorkloadRow[]> {
    this.asked.push(creatorId)

    return this.rows
  }

  async create(): Promise<OpportunityRecord> {
    throw new Error('not needed in this test')
  }

  async updateStatus(): Promise<OpportunityRecord> {
    throw new Error('not needed in this test')
  }

  async findPublished(): Promise<OpportunityRecord[]> {
    return []
  }

  async findCreatedBy(): Promise<OpportunityRecord[]> {
    return []
  }

  async findAwaitingApproval(): Promise<OpportunityRecord[]> {
    return []
  }

  async findBrief() {
    return null
  }

  async findSince() {
    return []
  }

  async findById(): Promise<OpportunityRecord | null> {
    return null
  }

    async update(): Promise<OpportunityRecord> {
    throw new Error('not needed in this test')
  }

  async closeApplications(): Promise<OpportunityRecord> {
    throw new Error('not needed in this test')
  }

  async remove(): Promise<void> {}

  async countActivity() {
    return { applications: 0, deliverables: 0, credited: 0 }
  }

  async setQrToken(): Promise<void> {}
}

class SilentUsers implements UserStore {
  async findByEmail() {
    return null
  }

  async findById() {
    return null
  }

  async findWithProfile() {
    return { profile: { skills: [], interests: [] } } as unknown as UserWithProfile
  }

  async createVolunteer() {
    throw new Error('not needed in this test')
  }

  async createOrganisation() {
    throw new Error('not needed in this test')
  }

  async updateAccount() {
    throw new Error('not needed in this test')
  }
}

const notifier: Notifier = {
  async send() {},
}

function buildService(store: CountingStore) {
  return new OpportunityService(store, new SilentUsers(), new MatchingService(), notifier)
}

describe('the organiser workload', () => {
  it('counts only for the organiser who asked', async () => {
    const rows: WorkloadRow[] = [
      {
        opportunityId: 'opportunity-1',
        pendingApplications: 3,
        acceptedApplications: 5,
        pendingDeliverables: 1,
      },
    ]
    const store = new CountingStore(rows)

    const result = await buildService(store).workload({
      userId: 'organisation-1',
      role: 'ORGANISATION',
    })

    expect(result).toEqual(rows)
    expect(store.asked).toEqual(['organisation-1'])
  })

  it('comes back empty for somebody who has posted nothing', async () => {
    const store = new CountingStore()

    const result = await buildService(store).workload({ userId: 'new-user', role: 'VOLUNTEER' })

    expect(result).toEqual([])
  })
})
