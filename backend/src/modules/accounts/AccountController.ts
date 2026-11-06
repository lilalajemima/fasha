import type { Request, Response } from 'express'
import { readPassword, readString } from '../../core/validation/readers'
import type { AccountService } from './AccountService'

export class AccountController {
  constructor(private readonly accounts: AccountService) {}

  changePassword = async (req: Request, res: Response) => {
    await this.accounts.changePassword(
      req.user!,
      readString(req.body, 'currentPassword'),
      readPassword(req.body, 'newPassword'),
    )

    res.status(204).send()
  }

  deactivate = async (req: Request, res: Response) => {
    await this.accounts.deactivate(req.user!, readString(req.body, 'password'))

    res.status(204).send()
  }

  remove = async (req: Request, res: Response) => {
    await this.accounts.remove(req.user!, readString(req.body, 'password'))

    res.status(204).send()
  }
}
