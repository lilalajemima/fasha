import type { Request, Response } from 'express'
import { readDecision, readHours, readUrl } from '../../core/validation/readers'
import { routeParam } from '../../core/http/params'
import type { SubmissionService } from './SubmissionService'

const MAX_HOURS = 24

export class SubmissionController {
  constructor(private readonly submissions: SubmissionService) {}

  submit = async (req: Request, res: Response) => {
    const view = await this.submissions.submit(req.user!, routeParam(req, 'id'), {
      hoursClaimed: readHours(req.body, 'hoursClaimed', MAX_HOURS),
      proofUrl: readUrl(req.body, 'proofUrl'),
    })

    res.status(201).json(view)
  }

  mine = async (req: Request, res: Response) => {
    res.json(await this.submissions.mine(req.user!))
  }

  forOpportunity = async (req: Request, res: Response) => {
    res.json(await this.submissions.forOpportunity(req.user!, routeParam(req, 'id')))
  }

  decide = async (req: Request, res: Response) => {
    res.json(await this.submissions.decide(req.user!, routeParam(req, 'id'), readDecision(req.body)))
  }
}
