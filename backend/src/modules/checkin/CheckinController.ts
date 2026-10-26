import type { Request, Response } from 'express'
import type { QrCodeRenderer } from '../../core/qr/QrCodeRenderer'
import { readString } from '../../core/validation/readers'
import type { CheckinService } from './CheckinService'

export class CheckinController {
  constructor(
    private readonly checkins: CheckinService,
    private readonly qrCodes: QrCodeRenderer,
  ) {}

  open = async (req: Request, res: Response) => {
    const opened = await this.checkins.openCheckIn(req.user!, req.params.id)

    res.json({ ...opened, qrSvg: await this.qrCodes.toSvg(opened.payload) })
  }

  checkIn = async (req: Request, res: Response) => {
    const view = await this.checkins.checkIn(
      req.user!,
      req.params.id,
      readString(req.body, 'code', 6),
    )

    res.status(201).json(view)
  }

  markPresent = async (req: Request, res: Response) => {
    const view = await this.checkins.markPresent(
      req.user!,
      req.params.id,
      readString(req.body, 'volunteerId'),
    )

    res.status(201).json(view)
  }

  checkOut = async (req: Request, res: Response) => {
    res.json(await this.checkins.checkOut(req.user!, req.params.id))
  }

  attendance = async (req: Request, res: Response) => {
    res.json(await this.checkins.attendance(req.user!, req.params.id))
  }
}
