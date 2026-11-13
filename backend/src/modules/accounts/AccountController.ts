import type { Request, Response } from 'express'
import { readEmail, readOptionalString, readPassword } from '../../core/validation/readers'
import type { AccountService, Proof } from './AccountService'

function proofFrom(body: Record<string, unknown>, field: string): Proof {
  return {
    password: readOptionalString(body, field),
    googleCredential: readOptionalString(body, 'googleCredential'),
  }
}

export class AccountController {
  constructor(private readonly accounts: AccountService) {}

  forgotten = async (req: Request, res: Response) => {
    await this.accounts.forgotten(readEmail(req.body))
    res.status(204).send()
  }

  changePassword = async (req: Request, res: Response) => {
    const token = await this.accounts.changePassword(
      req.user!,
      proofFrom(req.body, 'currentPassword'),
      readPassword(req.body, 'newPassword'),
    )

    res.json({ token })
  }

  deactivate = async (req: Request, res: Response) => {
    await this.accounts.deactivate(req.user!, proofFrom(req.body, 'password'))

    res.status(204).send()
  }

  remove = async (req: Request, res: Response) => {
    await this.accounts.remove(req.user!, proofFrom(req.body, 'password'))

    res.status(204).send()
  }
}
