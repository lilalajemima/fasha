import type { Request, Response } from 'express'
import { routeParam } from '../../core/http/params'
import type { NotificationService } from './NotificationService'

export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  feed = async (req: Request, res: Response) => {
    res.json(await this.notifications.feedFor(req.user!))
  }

  markRead = async (req: Request, res: Response) => {
    res.json(await this.notifications.markRead(req.user!, routeParam(req, 'id')))
  }

  markAllRead = async (req: Request, res: Response) => {
    res.json(await this.notifications.markAllRead(req.user!))
  }
}
