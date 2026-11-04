import type { AdminStore, PeriodTally, ReportFilter, Window } from './AdminStore'
import {
  toActivity,
  toCheckinsCsv,
  toEventsCsv,
  type ActivityView,
  type AdminSummary,
} from './AdminView'

const DAY = 24 * 60 * 60 * 1000
const DEFAULT_DAYS = 30
const ALL_TIME = new Date(0)

export type ReportGrain = 'events' | 'checkins'

function nothing(): PeriodTally {
  return {
    opportunitiesPosted: 0,
    citizenProposed: 0,
    published: 0,
    acceptedPlaces: 0,
    checkedIn: 0,
    hoursCredited: 0,
  }
}

export class AdminService {
  constructor(private readonly reports: AdminStore) {}

  /**
   * The numbers for a period, next to the same length of time immediately
   * before it, so the page can say whether something is going up or down.
   * Asking for all time has nothing to compare against, and says so.
   */
  async summary(days: number | null): Promise<AdminSummary> {
    const length = days === null ? DEFAULT_DAYS : Math.max(days, 0)
    const to = new Date()
    const comparable = length > 0
    const current: Window = {
      from: comparable ? new Date(to.getTime() - length * DAY) : ALL_TIME,
      to,
    }

    const [tally, awaitingReview, sectors, previous] = await Promise.all([
      this.reports.tally(current),
      this.reports.countAwaitingReview(),
      this.reports.countBySector(current),
      comparable
        ? this.reports.tally({
            from: new Date(current.from.getTime() - length * DAY),
            to: current.from,
          })
        : Promise.resolve(nothing()),
    ])

    return {
      days: length,
      from: current.from.toISOString(),
      to: current.to.toISOString(),
      current: tally,
      previous,
      comparable,
      awaitingReview,
      sectors,
    }
  }

  /** Everything ever posted, for the table the district reads. */
  async activity(): Promise<ActivityView[]> {
    return toActivity(await this.reports.listEvents(this.everything()))
  }

  /** A report the district asked for: a period, optionally one kind or one place. */
  async report(grain: ReportGrain, filter: Partial<ReportFilter>): Promise<string> {
    const whole: ReportFilter = {
      from: filter.from ?? ALL_TIME,
      to: filter.to ?? new Date(),
      mode: filter.mode ?? null,
      sector: filter.sector ?? null,
    }

    if (grain === 'checkins') {
      return toCheckinsCsv(await this.reports.listCheckins(whole))
    }

    return toEventsCsv(await this.reports.listEvents(whole))
  }

  private everything(): ReportFilter {
    return { from: ALL_TIME, to: new Date(), mode: null, sector: null }
  }
}
