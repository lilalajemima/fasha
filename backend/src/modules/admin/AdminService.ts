import type { AdminStore } from './AdminStore'
import { toActivity, toCsv, toSummary, type ActivityView, type AdminSummary } from './AdminView'

const DEFAULT_WINDOW_DAYS = 90

export class AdminService {
  constructor(private readonly reports: AdminStore) {}

  async summary(): Promise<AdminSummary> {
    const [people, initiatives, attendance, sectors] = await Promise.all([
      this.reports.countRoles(),
      this.reports.countInitiatives(),
      this.reports.countAttendance(),
      this.reports.countBySector(),
    ])

    return toSummary(people, initiatives, attendance, sectors)
  }

  async activity(): Promise<ActivityView[]> {
    return toActivity(await this.reports.listActivity())
  }

  async attendanceCsv(from: Date | null, to: Date | null): Promise<string> {
    const end = to ?? new Date()
    const start = from ?? new Date(end.getTime() - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000)

    return toCsv(await this.reports.listAttendance(start, end))
  }
}
