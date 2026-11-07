import { CheckInMethod, UserRole } from '@prisma/client'
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorisedError } from '../../core/errors/HttpErrors'
import type { Clock } from '../../core/time/Clock'
import type { TokenPayload } from '../../core/security/TokenService'
import type { TotpService } from '../../core/security/TotpService'
import type { ApplicationStore } from '../applications/ApplicationStore'
import type { OpportunityRecord, OpportunityStore } from '../opportunities/OpportunityStore'
import type { CheckinRecord, CheckinStore } from './CheckinStore'
import { hoursBetween, toAttendanceCsv, toCheckinView, type CheckinView } from './CheckinView'

export type CheckinCode = {
  code: string
  secondsRemaining: number
  payload: string
}

/**
 * Attendance for work that happens somewhere.
 *
 * The organiser's screen shows a code that changes every thirty seconds. What
 * is kept is the secret it comes from, minted once per opportunity and stored
 * on the row, so there is no list of codes to keep and nothing to tidy up
 * afterwards.
 *
 * Checking out asks the volunteer for the current code as well, because the
 * hours are credited at that moment. Without it somebody who left at midday
 * could close their own register from home in the evening and be paid for the
 * afternoon.
 *
 * Virtual work has no door to stand at, so it is measured by what gets
 * submitted instead and every method here refuses it.
 */
export class CheckinService {
  constructor(
    private readonly checkins: CheckinStore,
    private readonly opportunities: OpportunityStore,
    private readonly applications: ApplicationStore,
    private readonly totp: TotpService,
    private readonly clock: Clock,
    private readonly siteUrl: string,
  ) {}

  async openCheckIn(actor: TokenPayload, opportunityId: string): Promise<CheckinCode> {
    const opportunity = await this.loadOpportunity(opportunityId)

    this.assertOrganiser(actor, opportunity)
    this.assertHasADoor(opportunity)

    const secret = opportunity.qrToken ?? (await this.mintSecret(opportunityId))
    const now = this.clock.now()
    const code = this.totp.generate(secret, now)

    return {
      code,
      secondsRemaining: this.totp.secondsRemaining(now),
      payload: `${this.siteUrl}/check-in?o=${opportunityId}&c=${code}`,
    }
  }

  async checkIn(actor: TokenPayload, opportunityId: string, code: string): Promise<CheckinView> {
    if (actor.role !== UserRole.VOLUNTEER) {
      throw new ForbiddenError('Only volunteers check in to an opportunity')
    }

    const opportunity = await this.loadOpportunity(opportunityId)

    this.assertHasADoor(opportunity)

    if (!opportunity.qrToken) {
      throw new ConflictError('The organiser has not opened check in yet')
    }

    await this.assertAccepted(opportunityId, actor.userId)
    await this.assertNotAlreadyIn(opportunityId, actor.userId)

    if (!this.totp.verify(opportunity.qrToken, code, this.clock.now())) {
      throw new UnauthorisedError('That code has expired, ask the organiser for the current one')
    }

    return toCheckinView(
      await this.checkins.create(opportunityId, actor.userId, CheckInMethod.QR),
    )
  }

  async markPresent(
    actor: TokenPayload,
    opportunityId: string,
    volunteerId: string,
  ): Promise<CheckinView> {
    const opportunity = await this.loadOpportunity(opportunityId)

    this.assertOrganiser(actor, opportunity)
    this.assertHasADoor(opportunity)
    await this.assertAccepted(opportunityId, volunteerId)
    await this.assertNotAlreadyIn(opportunityId, volunteerId)

    return toCheckinView(
      await this.checkins.create(opportunityId, volunteerId, CheckInMethod.MANUAL),
    )
  }

  async checkOut(
    actor: TokenPayload,
    checkinId: string,
    code: string | null = null,
  ): Promise<CheckinView> {
    const checkin = await this.loadCheckin(checkinId)

    if (!this.mayCloseOff(actor, checkin)) {
      throw new ForbiddenError('Only the volunteer or the organiser can check someone out')
    }

    if (checkin.checkoutTime) {
      throw new ConflictError('That volunteer is already checked out')
    }

    if (actor.userId === checkin.volunteerId) {
      this.assertCodeMatches(checkin.opportunity.qrToken, code)
    }

    const leftAt = this.clock.now()
    const hours = hoursBetween(checkin.checkinTime, leftAt)

    return toCheckinView(
      await this.checkins.checkOutAndCredit(
        checkinId,
        leftAt,
        hours,
        checkin.opportunity.requiredSkills,
      ),
    )
  }

  async stillIn(actor: TokenPayload): Promise<CheckinView[]> {
    const records = await this.checkins.findOpenForVolunteer(actor.userId)

    return records.map(toCheckinView)
  }

  async attendanceCsv(actor: TokenPayload, opportunityId: string): Promise<string> {
    const opportunity = await this.loadOpportunity(opportunityId)

    this.assertOrganiser(actor, opportunity)

    return toAttendanceCsv(await this.checkins.findForOpportunity(opportunityId))
  }

  async attendance(actor: TokenPayload, opportunityId: string): Promise<CheckinView[]> {
    const opportunity = await this.loadOpportunity(opportunityId)

    this.assertOrganiser(actor, opportunity)

    const records = await this.checkins.findForOpportunity(opportunityId)

    return records.map(toCheckinView)
  }

  private async mintSecret(opportunityId: string): Promise<string> {
    const secret = this.totp.createSecret()

    await this.opportunities.setQrToken(opportunityId, secret)

    return secret
  }

  private assertHasADoor(opportunity: OpportunityRecord): void {
    if (opportunity.mode !== 'PHYSICAL') {
      throw new ConflictError(
        'Virtual opportunities are measured by what volunteers submit, not by attendance',
      )
    }
  }

  private assertCodeMatches(secret: string | null, code: string | null): void {
    if (!code) {
      throw new BadRequestError('Enter the code the organiser is showing to check out')
    }

    if (!secret || !this.totp.verify(secret, code, this.clock.now())) {
      throw new UnauthorisedError('That code has expired, ask the organiser for the current one')
    }
  }

  private assertOrganiser(actor: TokenPayload, opportunity: OpportunityRecord): void {
    const allowed = actor.userId === opportunity.creatorId || actor.role === UserRole.ADMIN

    if (!allowed) {
      throw new ForbiddenError('Only the organiser can manage attendance')
    }
  }

  private async assertAccepted(opportunityId: string, volunteerId: string): Promise<void> {
    const application = await this.applications.findAccepted(opportunityId, volunteerId)

    if (!application) {
      throw new ForbiddenError('Only volunteers with an accepted place can check in')
    }
  }

  private async assertNotAlreadyIn(opportunityId: string, volunteerId: string): Promise<void> {
    const existing = await this.checkins.findOne(opportunityId, volunteerId)

    if (existing) {
      throw new ConflictError('That volunteer is already checked in')
    }
  }

  private mayCloseOff(actor: TokenPayload, checkin: CheckinRecord): boolean {
    return (
      actor.userId === checkin.volunteerId ||
      actor.userId === checkin.opportunity.creatorId ||
      actor.role === UserRole.ADMIN
    )
  }

  private async loadOpportunity(id: string): Promise<OpportunityRecord> {
    const opportunity = await this.opportunities.findById(id)

    if (!opportunity) {
      throw new NotFoundError('That opportunity does not exist')
    }

    return opportunity
  }

  private async loadCheckin(id: string): Promise<CheckinRecord> {
    const checkin = await this.checkins.findById(id)

    if (!checkin) {
      throw new NotFoundError('That check in does not exist')
    }

    return checkin
  }
}
