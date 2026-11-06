import { NotFoundError } from '../../core/errors/HttpErrors'
import type { TokenPayload } from '../../core/security/TokenService'
import type { ProfileStore } from '../profile/ProfileStore'
import type { PortfolioStore } from './PortfolioStore'
import { toPortfolioView, type PortfolioView } from './PortfolioView'

export class PortfolioService {
  constructor(
    private readonly entries: PortfolioStore,
    private readonly profiles: ProfileStore,
  ) {}

  async mine(actor: TokenPayload): Promise<PortfolioView> {
    const owner = await this.profiles.findByUserId(actor.userId)

    if (!owner) {
      throw new NotFoundError('Only volunteer accounts keep a portfolio')
    }

    return this.buildFor(owner)
  }

  async bySlug(slug: string): Promise<PortfolioView> {
    const owner = await this.profiles.findBySlug(slug)

    if (!owner) {
      throw new NotFoundError('No volunteer has that portfolio address')
    }

    return this.buildFor(owner)
  }

  private async buildFor(owner: { userId: string; name: string; portfolioSlug: string }) {
    const [records, organised] = await Promise.all([
      this.entries.findForVolunteer(owner.userId),
      this.entries.countOrganised(owner.userId),
    ])

    return toPortfolioView(
      {
        name: owner.name,
        portfolioSlug: owner.portfolioSlug,
        avatar: owner.avatar,
        bio: owner.bio,
      },
      records,
      organised,
    )
  }
}