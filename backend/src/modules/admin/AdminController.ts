import type { Request, Response } from 'express'
import type { AdminService, ReportGrain } from './AdminService'

function readDate(value: unknown, endOfDay = false): Date | undefined {
  if (typeof value !== 'string' || value === '') return undefined

  const parsed = new Date(endOfDay && value.length === 10 ? `${value}T23:59:59.999Z` : value)

  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function readDays(value: unknown): number | null {
  if (typeof value !== 'string' || value === '') return null

  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function readMode(value: unknown): 'PHYSICAL' | 'VIRTUAL' | null {
  return value === 'PHYSICAL' || value === 'VIRTUAL' ? value : null
}

function readText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

function readGrain(value: unknown): ReportGrain {
  return value === 'checkins' ? 'checkins' : 'events'
}

export class AdminController {
  constructor(private readonly admin: AdminService) {}

  summary = async (req: Request, res: Response) => {
    res.json(await this.admin.summary(readDays(req.query.days)))
  }

  activity = async (_req: Request, res: Response) => {
    res.json(await this.admin.activity())
  }

  report = async (req: Request, res: Response) => {
    const grain = readGrain(req.query.grain)
    const csv = await this.admin.report(grain, {
      from: readDate(req.query.from),
      to: readDate(req.query.to, true),
      mode: readMode(req.query.mode),
      sector: readText(req.query.sector),
    })
    const stamp = new Date().toISOString().slice(0, 10)

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="fasha-${grain}-${stamp}.csv"`)
    res.send(csv)
  }
}
