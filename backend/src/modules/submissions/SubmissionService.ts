import { SubmissionStatus, UserRole } from '@prisma/client'
import { ConflictError, ForbiddenError, NotFoundError } from '../../core/errors/HttpErrors'
import type { TokenPayload } from '../../core/security/TokenService'
import type { ApplicationStore } from '../applications/ApplicationStore'
import { NOTIFICATION_TYPES, type Notifier } from '../notifications/Notifier'
import type { OpportunityStore } from '../opportunities/OpportunityStore'
import type { NewSubmission, SubmissionRecord, SubmissionStore } from './SubmissionStore'
import { toSubmissionView, type SubmissionView } from './SubmissionView'

export class SubmissionService {
  constructor(
    private readonly submissions: SubmissionStore,
    private readonly applications: ApplicationStore,
    private readonly opportunities: OpportunityStore,
    private readonly notifier: Notifier,
  ) {}

  async submit(
    actor: TokenPayload,
    opportunityId: string,
    input: NewSubmission,
  ): Promise<SubmissionView> {
    if (actor.role !== UserRole.VOLUNTEER) {
      throw new ForbiddenError('Only volunteers submit hours')
    }

    const application = await this.applications.findAccepted(opportunityId, actor.userId)

    if (!application) {
      throw new ForbiddenError('Only volunteers with an accepted place can submit hours')
    }

    const open = await this.submissions.findOpen(opportunityId, actor.userId)

    if (open) {
      throw new ConflictError('You already have hours waiting on that opportunity')
    }

    return toSubmissionView(await this.submissions.create(opportunityId, actor.userId, input))
  }

  async mine(actor: TokenPayload): Promise<SubmissionView[]> {
    const records = await this.submissions.findByVolunteer(actor.userId)

    return records.map(toSubmissionView)
  }

  async forOpportunity(actor: TokenPayload, opportunityId: string): Promise<SubmissionView[]> {
    const opportunity = await this.opportunities.findById(opportunityId)

    if (!opportunity) {
      throw new NotFoundError('That opportunity does not exist')
    }

    const allowed = actor.userId === opportunity.creatorId || actor.role === UserRole.ADMIN

    if (!allowed) {
      throw new ForbiddenError('Only the organiser can review submitted hours')
    }

    const records = await this.submissions.findForOpportunity(opportunityId)

    return records.map(toSubmissionView)
  }

  async decide(
    actor: TokenPayload,
    submissionId: string,
    decision: 'APPROVE' | 'REJECT',
  ): Promise<SubmissionView> {
    const submission = await this.load(submissionId)

    if (!this.mayReview(actor, submission)) {
      throw new ForbiddenError('Only the organiser can review submitted hours')
    }

    if (submission.status !== SubmissionStatus.PENDING) {
      throw new ConflictError('Those hours have already been reviewed')
    }

    if (decision === 'REJECT') {
      const rejected = await this.submissions.reject(submissionId)

      await this.notifier.send(
        rejected.volunteerId,
        NOTIFICATION_TYPES.hoursDecided,
        `Your hours for "${rejected.opportunity.title}" were not approved.`,
      )

      return toSubmissionView(rejected)
    }

    const approved = await this.submissions.approveAndCredit(
      submissionId,
      submission.hoursClaimed,
      submission.opportunity.requiredSkills,
    )

    await this.notifier.send(
      approved.volunteerId,
      NOTIFICATION_TYPES.hoursDecided,
      `${approved.hoursClaimed} hours for "${approved.opportunity.title}" are now on your portfolio.`,
    )

    return toSubmissionView(approved)
  }

  private mayReview(actor: TokenPayload, submission: SubmissionRecord): boolean {
    return actor.userId === submission.opportunity.creatorId || actor.role === UserRole.ADMIN
  }

  private async load(id: string): Promise<SubmissionRecord> {
    const submission = await this.submissions.findById(id)

    if (!submission) {
      throw new NotFoundError('Those submitted hours do not exist')
    }

    return submission
  }
}
