import { OpportunityStatus, UserRole } from '@prisma/client'
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../core/errors/HttpErrors'
import type { TokenPayload } from '../../core/security/TokenService'
import type { UserStore } from '../auth/UserStore'
import type { MatchingService } from '../matching/MatchingService'
import { NOTIFICATION_TYPES, type Notifier } from '../notifications/Notifier'
import type {
  BriefFile,
  FeedFilter,
  NewOpportunity,
  OpportunityRecord,
  OpportunityStore,
  WorkloadRow,
} from './OpportunityStore'
import { toView, type OpportunityView } from './OpportunityView'

const DIRECT_PUBLISH_ROLES: string[] = [UserRole.ORGANISATION, UserRole.ADMIN]
const REVIEWER_ROLES: string[] = [UserRole.ADMIN]

export class OpportunityService {
  constructor(
    private readonly opportunities: OpportunityStore,
    private readonly users: UserStore,
    private readonly matching: MatchingService,
    private readonly notifier: Notifier,
  ) {}

  async create(creator: TokenPayload, input: NewOpportunity): Promise<OpportunityView> {
    this.assertShape(input)

    const record = await this.opportunities.create(
      creator.userId,
      this.statusForNew(creator.role),
      input,
    )

    return toView(record)
  }

  /**
   * Edits are the creator's alone, and only until applications close: changing
   * the date or the place under somebody who already signed up is the thing
   * that makes a platform untrustworthy. A rejected proposal is the exception
   * worth keeping open, since the reviewer's note is useless if it cannot be
   * acted on; editing one sends it back for review.
   */
  async update(
    actor: TokenPayload,
    id: string,
    input: NewOpportunity,
  ): Promise<OpportunityView> {
    const record = await this.findOrFail(id)

    this.assertOwner(actor, record)
    this.assertShape(input)

    if (record.status === OpportunityStatus.PUBLISHED && this.hasPassed(record.applicationDeadline)) {
      throw new ConflictError('Applications have closed, so this can no longer be edited')
    }

    const status =
      record.status === OpportunityStatus.REJECTED
        ? OpportunityStatus.PENDING_APPROVAL
        : record.status

    return toView(await this.opportunities.update(id, input, status))
  }

  /** Stops new applications and keeps everyone's record intact. */
  async closeEarly(actor: TokenPayload, id: string): Promise<OpportunityView> {
    const record = await this.findOrFail(id)

    this.assertOwner(actor, record)

    if (record.status !== OpportunityStatus.PUBLISHED) {
      throw new ConflictError('Only a published opportunity can be closed early')
    }

    if (this.hasPassed(record.applicationDeadline)) {
      throw new ConflictError('Applications have already closed')
    }

    return toView(await this.opportunities.closeApplications(id, new Date()))
  }

  /**
   * Deleting is only honest while the opportunity is still nobody else's: one
   * application, deliverable or credited hour and the row belongs to that
   * person too.
   */
  async remove(actor: TokenPayload, id: string): Promise<void> {
    const record = await this.findOrFail(id)

    this.assertOwner(actor, record)

    const activity = await this.opportunities.countActivity(id)
    const attached = activity.applications + activity.deliverables + activity.credited

    if (attached > 0) {
      throw new ConflictError(
        'People have already taken part in this one, so it cannot be deleted. Close it early instead.',
      )
    }

    await this.opportunities.remove(id)
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

  /**
   * The brief of published work, readable by anyone — a portfolio is public,
   * and a brief that needs a token could not open from one. Before it is
   * published, only the people who may already inspect it.
   */
  async brief(viewer: TokenPayload | undefined, id: string): Promise<BriefFile> {
    const record = await this.findOrFail(id)

    if (record.status !== OpportunityStatus.PUBLISHED) {
      if (!viewer || !this.mayInspect(viewer, record)) {
        throw new ForbiddenError('That opportunity is not published yet')
      }
    }

    const file = await this.opportunities.findBrief(id)

    if (!file) {
      throw new NotFoundError('That opportunity has no brief')
    }

    return file
  }

  /** Everything the community admin oversees, for the calendar on their overview. */
  async everything(viewer: TokenPayload, months: number): Promise<OpportunityView[]> {
    if (!REVIEWER_ROLES.includes(viewer.role)) {
      throw new ForbiddenError('Only the community admin sees every opportunity')
    }

    const since = new Date()

    since.setMonth(since.getMonth() - months)

    const records = await this.opportunities.findSince(since)

    return records.map(record => toView(record))
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

  /** What is waiting on this organiser, one row per opportunity they posted. */
  async workload(creator: TokenPayload): Promise<WorkloadRow[]> {
    return this.opportunities.countWorkload(creator.userId)
  }

  async awaitingApproval(): Promise<OpportunityView[]> {
    const records = await this.opportunities.findAwaitingApproval()

    return records.map(record => toView(record))
  }

  async decide(
    id: string,
    decision: 'APPROVE' | 'REJECT',
    reviewNote: string | null = null,
  ): Promise<OpportunityView> {
    const record = await this.findOrFail(id)

    if (record.status !== OpportunityStatus.PENDING_APPROVAL) {
      throw new ConflictError('That opportunity has already been reviewed')
    }

    if (record.creator.role !== UserRole.VOLUNTEER) {
      throw new ConflictError('Only citizen initiatives go through review')
    }

    const approved = decision === 'APPROVE'
    const status = approved ? OpportunityStatus.PUBLISHED : OpportunityStatus.REJECTED
    const updated = await this.opportunities.updateStatus(id, status, reviewNote)

    await this.notifier.send(
      updated.creatorId,
      NOTIFICATION_TYPES.initiativeDecided,
      approved
        ? `Your initiative "${updated.title}" was approved and is now in Discover.`
        : `Your initiative "${updated.title}" was not approved this time.${
            reviewNote ? ` ${reviewNote}` : ''
          }`,
    )

    return toView(updated)
  }

  private assertShape(input: NewOpportunity): void {
    if (input.mode === 'PHYSICAL' && !input.location) {
      throw new BadRequestError('A physical opportunity needs a location')
    }

    if (input.mode === 'PHYSICAL' && !input.startsAt) {
      throw new BadRequestError('A physical opportunity needs a start time')
    }

    if (input.startsAt && input.startsAt.getTime() >= input.endsAt.getTime()) {
      throw new BadRequestError('It has to finish after it starts')
    }

    if (input.applicationDeadline.getTime() > input.endsAt.getTime()) {
      throw new BadRequestError('Applications cannot close after the work is over')
    }
  }

  private assertOwner(actor: TokenPayload, record: OpportunityRecord): void {
    if (actor.userId !== record.creatorId) {
      throw new ForbiddenError('That opportunity belongs to somebody else')
    }
  }

  private hasPassed(moment: Date): boolean {
    return moment.getTime() <= Date.now()
  }

  private statusForNew(creatorRole: string): OpportunityStatus {
    return DIRECT_PUBLISH_ROLES.includes(creatorRole)
      ? OpportunityStatus.PUBLISHED
      : OpportunityStatus.PENDING_APPROVAL
  }

  private mayInspect(viewer: TokenPayload, record: OpportunityRecord): boolean {
    return viewer.userId === record.creatorId || REVIEWER_ROLES.includes(viewer.role)
  }

  private async findOrFail(id: string): Promise<OpportunityRecord> {
    const record = await this.opportunities.findById(id)

    if (!record) {
      throw new NotFoundError('That opportunity does not exist')
    }

    return record
  }
}