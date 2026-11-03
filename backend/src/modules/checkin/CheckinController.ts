import type { Request, Response } from 'express'
import type { QrCodeRenderer } from '../../core/qr/QrCodeRenderer'
import { readOptionalString, readString } from '../../core/validation/readers'
import { routeParam } from '../../core/http/params'
import type { CheckinService } from './CheckinService'

export class CheckinController {
  constructor(
    private readonly checkins: CheckinService,
    private readonly qrCodes: QrCodeRenderer,
  ) {}

  open = async (req: Request, res: Response) => {
    const opened = await this.checkins.openCheckIn(req.user!, routeParam(req, 'id'))

    res.json({ ...opened, qrSvg: await this.qrCodes.toSvg(opened.payload) })
  }

  checkIn = async (req: Request, res: Response) => {
    const view = await this.checkins.checkIn(
      req.user!,
      routeParam(req, 'id'),
      readString(req.body, 'code', 6),
    )

    res.status(201).json(view)
  }

  markPresent = async (req: Request, res: Response) => {
    const view = await this.checkins.markPresent(
      req.user!,
      routeParam(req, 'id'),
      readString(req.body, 'volunteerId'),
    )

    res.status(201).json(view)
  }

  stillIn = async (req: Request, res: Response) => {
    res.json(await this.checkins.stillIn(req.user!))
  }

  checkOut = async (req: Request, res: Response) => {
    const view = await this.checkins.checkOut(
      req.user!,
      routeParam(req, 'id'),
      readOptionalString(req.body ?? {}, 'code'),
    )

    res.json(view)
  }

  attendanceCsv = async (req: Request, res: Response) => {
    const csv = await this.checkins.attendanceCsv(req.user!, routeParam(req, 'id'))
    const stamp = new Date().toISOString().slice(0, 10)

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="attendance-${stamp}.csv"`)
    res.send(csv)
  }

  attendance = async (req: Request, res: Response) => {
    res.json(await this.checkins.attendance(req.user!, routeParam(req, 'id')))
  }
}
