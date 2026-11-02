import type { Request, Response } from 'express'
import type { AdminService } from './AdminService'

function readDate(value: unknown): Date | null {
  if (typeof value !== 'string' || value === '') return null

  const parsed = new Date(value)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export class AdminController {
  constructor(private readonly admin: AdminService) {}

  summary = async (_req: Request, res: Response) => {
    res.json(await this.admin.summary())
  }

  activity = async (_req: Request, res: Response) => {
    res.json(await this.admin.activity())
  }

  attendanceCsv = async (req: Request, res: Response) => {
    const csv = await this.admin.attendanceCsv(readDate(req.query.from), readDate(req.query.to))
    const stamp = new Date().toISOString().slice(0, 10)

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="fasha-attendance-${stamp}.csv"`)
    res.send(csv)
  }
}
