import type { Request, Response } from 'express'
import {
  readCount,
  readDecision,
  readFutureDate,
  readMode,
  readOptionalString,
  readString,
  readTagList,
} from '../../core/validation/readers'
import type { FeedFilter } from './OpportunityStore'
import type { OpportunityService } from './OpportunityService'

export class OpportunityController {
  constructor(private readonly opportunities: OpportunityService) {}

  create = async (req: Request, res: Response) => {
    const view = await this.opportunities.create(req.user!, {
      title: readString(req.body, 'title', 6),
      description: readString(req.body, 'description', 20),
      mode: readMode(req.body),
      location: readOptionalString(req.body, 'location'),
      maxCapacity: readCount(req.body, 'maxCapacity'),
      applicationDeadline: readFutureDate(req.body, 'applicationDeadline'),
      requiredSkills: readTagList(req.body, 'requiredSkills'),
      categories: readTagList(req.body, 'categories'),
    })

    res.status(201).json(view)
  }

  feed = async (req: Request, res: Response) => {
    res.json(await this.opportunities.feed(req.user!, this.filterFrom(req)))
  }

  mine = async (req: Request, res: Response) => {
    res.json(await this.opportunities.createdBy(req.user!))
  }

  awaitingApproval = async (_req: Request, res: Response) => {
    res.json(await this.opportunities.awaitingApproval())
  }

  detail = async (req: Request, res: Response) => {
    res.json(await this.opportunities.detail(req.user!, req.params.id))
  }

  decide = async (req: Request, res: Response) => {
    res.json(await this.opportunities.decide(req.params.id, readDecision(req.body)))
  }

  private filterFrom(req: Request): FeedFilter {
    const search = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    const mode = req.query.mode

    return {
      search: search.length > 0 ? search : null,
      mode: mode === 'PHYSICAL' || mode === 'VIRTUAL' ? mode : null,
    }
  }
}
