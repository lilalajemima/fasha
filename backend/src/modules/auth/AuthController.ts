import type { Request, Response } from 'express'
import { readEmail, readPassword, readRole, readString } from '../../core/validation/readers'
import type { AuthService } from './AuthService'

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response) => {
    const result = await this.authService.register({
      name: readString(req.body, 'name', 2),
      email: readEmail(req.body),
      password: readPassword(req.body),
      role: readRole(req.body),
    })

    res.status(201).json(result)
  }

  login = async (req: Request, res: Response) => {
    const result = await this.authService.login(
      readEmail(req.body),
      readString(req.body, 'password'),
    )

    res.json(result)
  }

  me = async (req: Request, res: Response) => {
    res.json(await this.authService.profileOf(req.user!.userId))
  }
}
