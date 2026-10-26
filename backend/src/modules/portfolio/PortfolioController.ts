import type { Request, Response } from 'express'
import type { PortfolioService } from './PortfolioService'

export class PortfolioController {
  constructor(private readonly portfolios: PortfolioService) {}

  mine = async (req: Request, res: Response) => {
    res.json(await this.portfolios.mine(req.user!))
  }

  public = async (req: Request, res: Response) => {
    res.json(await this.portfolios.bySlug(req.params.slug))
  }
}
