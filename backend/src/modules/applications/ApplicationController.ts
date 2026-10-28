import type { Request, Response } from 'express'
import {
  readApplicationDecision,
  readOptionalString,
  readString,
} from '../../core/validation/readers'
import { routeParam } from '../../core/http/params'
import type { ApplicationService } from './ApplicationService'

const MIN_STATEMENT_LENGTH = 30

export class ApplicationController {
  constructor(private readonly applications: ApplicationService) {}

  apply = async (req: Request, res: Response) => {
    const view = await this.applications.apply(req.user!, routeParam(req, 'id'), {
      motivationStatement: readString(req.body, 'motivationStatement', MIN_STATEMENT_LENGTH),
      resumeUrl: readOptionalString(req.body, 'resumeUrl'),
    })

    res.status(201).json(view)
  }

  mine = async (req: Request, res: Response) => {
    res.json(await this.applications.mine(req.user!))
  }

  forOpportunity = async (req: Request, res: Response) => {
    res.json(await this.applications.forOpportunity(req.user!, routeParam(req, 'id')))
  }

  decide = async (req: Request, res: Response) => {
    const view = await this.applications.decide(
      req.user!,
      routeParam(req, 'id'),
      readApplicationDecision(req.body),
    )

    res.json(view)
  }

  withdraw = async (req: Request, res: Response) => {
    res.json(await this.applications.withdraw(req.user!, routeParam(req, 'id')))
  }
}
