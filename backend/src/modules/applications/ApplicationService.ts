import { ApplicationStatus, OpportunityStatus, UserRole } from '@prisma/client'
import { ConflictError, ForbiddenError, NotFoundError } from '../../core/errors/HttpErrors'
import type { TokenPayload } from '../../core/security/TokenService'
import type { OpportunityRecord, OpportunityStore } from '../opportunities/OpportunityStore'
import { NOTIFICATION_TYPES, type Notifier } from '../notifications/Notifier'
import type { ApplicationRecord, ApplicationStore, NewApplication } from './ApplicationStore'
import { toApplicationView, type ApplicationView } from './ApplicationView'

const OPEN_STATUSES: string[] = [ApplicationStatus.PENDING, ApplicationStatus.ACCEPTED]

export class ApplicationService {
  constructor(
    private readonly applications: ApplicationStore,
    private readonly opportunities: OpportunityStore,
    private readonly notifier: Notifier,
  ) {}

  async apply(
    actor: TokenPayload,
    opportunityId: string,
    input: NewApplication,
  ): Promise<ApplicationView> {
    if (actor.role !== UserRole.VOLUNTEER) {
      throw new ForbiddenError('Only volunteer accounts can apply to an opportunity')
    }

    const opportunity = await this.loadOpportunity(opportunityId)

    if (opportunity.creatorId === actor.userId) {
      throw new ConflictError('You cannot apply to your own opportunity')
    }

    if (opportunity.status !== OpportunityStatus.PUBLISHED) {
      throw new ConflictError('That opportunity is not open for applications')
    }

    if (opportunity.applicationDeadline.getTime() <= Date.now()) {
      throw new ConflictError('The deadline for that opportunity has passed')
    }

    const record = await this.applications.create(opportunityId, actor.userId, input)

    await this.notifier.send(
      opportunity.creatorId,
      NOTIFICATION_TYPES.applicationReceived,
      `${record.volunteer.name} applied to "${opportunity.title}".`,
    )

    return toApplicationView(record)
  }

  async mine(actor: TokenPayload): Promise<ApplicationView[]> {
    const records = await this.applications.findByVolunteer(actor.userId)

    return records.map(toApplicationView)
  }

  async forOpportunity(actor: TokenPayload, opportunityId: string): Promise<ApplicationView[]> {
    const opportunity = await this.loadOpportunity(opportunityId)

    if (!this.mayManage(actor, opportunity.creatorId)) {
      throw new ForbiddenError('Only the organiser can see who applied')
    }

    const records = await this.applications.findForOpportunity(opportunityId)

    // Best fit first, as Discover orders opportunities for a volunteer. Two
    // equal scores fall back to who applied first, so the order is stable and
    // nobody is pushed down the list by a later arrival.
    return records
      .map(toApplicationView)
      .sort(
        (a, b) =>
          b.match.score - a.match.score || a.createdAt.localeCompare(b.createdAt),
      )
  }

  async decide(
    actor: TokenPayload,
    applicationId: string,
    decision: 'ACCEPT' | 'REJECT',
  ): Promise<ApplicationView> {
    const application = await this.loadApplication(applicationId)

    if (!this.mayManage(actor, application.opportunity.creatorId)) {
      throw new ForbiddenError('Only the organiser can decide on an application')
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new ConflictError('That application has already been decided')
    }

    if (decision === 'REJECT') {
      const rejected = await this.applications.updateStatus(
        applicationId,
        ApplicationStatus.REJECTED,
      )

      await this.notifier.send(
        rejected.volunteerId,
        NOTIFICATION_TYPES.applicationDecided,
        `Your application for "${rejected.opportunity.title}" was not successful this time.`,
      )

      return toApplicationView(rejected)
    }

    const accepted = await this.applications.acceptIfSpace(
      applicationId,
      application.opportunityId,
      application.opportunity.maxCapacity,
    )

    if (!accepted) {
      throw new ConflictError('Every place on that opportunity is taken')
    }

    await this.notifier.send(
      accepted.volunteerId,
      NOTIFICATION_TYPES.applicationDecided,
      `You have a place on "${accepted.opportunity.title}".`,
    )

    return toApplicationView(accepted)
  }

  async withdraw(actor: TokenPayload, applicationId: string): Promise<ApplicationView> {
    const application = await this.loadApplication(applicationId)

    if (application.volunteerId !== actor.userId) {
      throw new ForbiddenError('You can only withdraw your own application')
    }

    if (!OPEN_STATUSES.includes(application.status)) {
      throw new ConflictError('That application is already closed')
    }

    return toApplicationView(
      await this.applications.updateStatus(applicationId, ApplicationStatus.WITHDRAWN),
    )
  }

  private mayManage(actor: TokenPayload, creatorId: string): boolean {
    return actor.userId === creatorId || actor.role === UserRole.ADMIN
  }

  private async loadOpportunity(id: string): Promise<OpportunityRecord> {
    const opportunity = await this.opportunities.findById(id)

    if (!opportunity) {
      throw new NotFoundError('That opportunity does not exist')
    }

    return opportunity
  }

  private async loadApplication(id: string): Promise<ApplicationRecord> {
    const application = await this.applications.findById(id)

    if (!application) {
      throw new NotFoundError('That application does not exist')
    }

    return application
  }
}
