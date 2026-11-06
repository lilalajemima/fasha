import type { Request, Response } from 'express'
import { INTERESTS, SKILLS } from '../../core/domain/catalogue'
import {
  readCount,
  readDecision,
  readFutureDate,
  readMode,
  readOptionalFutureDate,
  readOptionalString,
  readSector,
  readShortText,
  readString,
  readOptionalPdf,
  readTagList,
} from '../../core/validation/readers'
import type { FeedFilter, NewOpportunity } from './OpportunityStore'
import { routeParam } from '../../core/http/params'
import type { OpportunityService } from './OpportunityService'

const MAX_NOTE_LENGTH = 400

export class OpportunityController {
  constructor(private readonly opportunities: OpportunityService) {}

  create = async (req: Request, res: Response) => {
    const view = await this.opportunities.create(req.user!, this.draftFrom(req))

    res.status(201).json(view)
  }

  update = async (req: Request, res: Response) => {
    const view = await this.opportunities.update(
      req.user!,
      routeParam(req, 'id'),
      this.draftFrom(req),
    )

    res.json(view)
  }

  close = async (req: Request, res: Response) => {
    res.json(await this.opportunities.closeEarly(req.user!, routeParam(req, 'id')))
  }

  remove = async (req: Request, res: Response) => {
    await this.opportunities.remove(req.user!, routeParam(req, 'id'))

    res.status(204).send()
  }

  feed = async (req: Request, res: Response) => {
    res.json(await this.opportunities.feed(req.user!, this.filterFrom(req)))
  }

  mine = async (req: Request, res: Response) => {
    res.json(await this.opportunities.createdBy(req.user!))
  }

  workload = async (req: Request, res: Response) => {
    res.json(await this.opportunities.workload(req.user!))
  }

  awaitingApproval = async (_req: Request, res: Response) => {
    res.json(await this.opportunities.awaitingApproval())
  }

  /** The PDF itself, sent as a PDF rather than as JSON. */
  brief = async (req: Request, res: Response) => {
    const file = await this.opportunities.brief(req.user, routeParam(req, 'id'))

    res.type('application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${file.name.replace(/"/g, '')}"`)
    res.send(Buffer.from(file.data, 'base64'))
  }

  /** A year of everything, which is as far back as the calendar reaches. */
  everything = async (req: Request, res: Response) => {
    res.json(await this.opportunities.everything(req.user!, 12))
  }

  detail = async (req: Request, res: Response) => {
    res.json(await this.opportunities.detail(req.user!, routeParam(req, 'id')))
  }

  decide = async (req: Request, res: Response) => {
    const view = await this.opportunities.decide(
      routeParam(req, 'id'),
      readDecision(req.body),
      readShortText(req.body, 'reviewNote', MAX_NOTE_LENGTH),
    )

    res.json(view)
  }

  /** Create and update take the same body, so they read it the same way. */
  private draftFrom(req: Request): NewOpportunity {
    return {
      title: readString(req.body, 'title', 6),
      description: readString(req.body, 'description', 20),
      mode: readMode(req.body),
      location: readOptionalString(req.body, 'location'),
      sector: readSector(req.body, 'sector'),
      maxCapacity: readCount(req.body, 'maxCapacity'),
      applicationDeadline: readFutureDate(req.body, 'applicationDeadline'),
      startsAt: readOptionalFutureDate(req.body, 'startsAt'),
      endsAt: readFutureDate(req.body, 'endsAt'),
      requiredSkills: readTagList(req.body, 'requiredSkills', SKILLS),
      categories: readTagList(req.body, 'categories', INTERESTS),
      brief: readOptionalPdf(req.body, 'brief'),
    }
  }

  private filterFrom(req: Request): FeedFilter {
    const search = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    const mode = req.query.mode
    const sector = typeof req.query.sector === 'string' ? req.query.sector.trim() : ''

    return {
      search: search.length > 0 ? search : null,
      mode: mode === 'PHYSICAL' || mode === 'VIRTUAL' ? mode : null,
      sector: sector.length > 0 ? sector : null,
    }
  }
}