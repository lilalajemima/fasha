import { OpportunityStatus, UserRole } from '@prisma/client'
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../core/errors/HttpErrors'
import type { TokenPayload } from '../../core/security/TokenService'
import type { UserStore } from '../auth/UserStore'
import type { MatchingService } from '../matching/MatchingService'
import type { FeedFilter, NewOpportunity, OpportunityRecord, OpportunityStore } from './OpportunityStore'
import { toView, type OpportunityView } from './OpportunityView'

const APPROVER_ROLES: string[] = [UserRole.ORGANISATION, UserRole.ADMIN]

export class OpportunityService {
  constructor(
    private readonly opportunities: OpportunityStore,
    private readonly users: UserStore,
    private readonly matching: MatchingService,
  ) {}

  async create(creator: TokenPayload, input: NewOpportunity): Promise<OpportunityView> {
    if (input.mode === 'PHYSICAL' && !input.location) {
      throw new BadRequestError('A physical opportunity needs a location')
    }

    const record = await this.opportunities.create(
      creator.userId,
      this.statusForNew(creator.role),
      input,
    )

    return toView(record)
  }

  async feed(viewer: TokenPayload, filter: FeedFilter): Promise<OpportunityView[]> {
    const published = await this.opportunities.findPublished(filter)

    if (viewer.role !== UserRole.VOLUNTEER) {
      return published.map(record => toView(record))
    }

    const profile = await this.users.findWithProfile(viewer.userId)
    const tags = {
      skills: profile?.profile?.skills ?? [],
      interests: profile?.profile?.interests ?? [],
    }

    return this.matching
      .rank(tags, published)
      .map(entry => toView(entry.opportunity, entry.score))
  }

  async detail(viewer: TokenPayload, id: string): Promise<OpportunityView> {
    const record = await this.findOrFail(id)

    if (record.status !== OpportunityStatus.PUBLISHED && !this.mayInspect(viewer, record)) {
      throw new ForbiddenError('That opportunity is not published yet')
    }

    return toView(record)
  }

  async createdBy(creator: TokenPayload): Promise<OpportunityView[]> {
    const records = await this.opportunities.findCreatedBy(creator.userId)

    return records.map(record => toView(record))
  }

  async awaitingApproval(): Promise<OpportunityView[]> {
    const records = await this.opportunities.findAwaitingApproval()

    return records.map(record => toView(record))
  }

  async decide(id: string, decision: 'APPROVE' | 'REJECT'): Promise<OpportunityView> {
    const record = await this.findOrFail(id)

    if (record.status !== OpportunityStatus.PENDING_APPROVAL) {
      throw new ConflictError('That opportunity has already been reviewed')
    }

    const status = decision === 'APPROVE'
      ? OpportunityStatus.PUBLISHED
      : OpportunityStatus.REJECTED

    return toView(await this.opportunities.updateStatus(id, status))
  }

  private statusForNew(creatorRole: string): OpportunityStatus {
    return APPROVER_ROLES.includes(creatorRole)
      ? OpportunityStatus.PUBLISHED
      : OpportunityStatus.PENDING_APPROVAL
  }

  private mayInspect(viewer: TokenPayload, record: OpportunityRecord): boolean {
    return viewer.userId === record.creatorId || APPROVER_ROLES.includes(viewer.role)
  }

  private async findOrFail(id: string): Promise<OpportunityRecord> {
    const record = await this.opportunities.findById(id)

    if (!record) {
      throw new NotFoundError('That opportunity does not exist')
    }

    return record
  }
}
