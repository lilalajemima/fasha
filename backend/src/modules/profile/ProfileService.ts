import { BadRequestError, ForbiddenError, NotFoundError } from '../../core/errors/HttpErrors'
import type { TokenPayload } from '../../core/security/TokenService'
import type { UserStore, UserWithProfile } from '../auth/UserStore'
import type { ProfileChanges, ProfileStore } from './ProfileStore'
import { toProfileView, type ProfileView } from './ProfileView'

export type ProfileUpdate = ProfileChanges & { name?: string }

export class ProfileService {
  constructor(
    private readonly users: UserStore,
    private readonly profiles: ProfileStore,
  ) {}

  async update(actor: TokenPayload, update: ProfileUpdate): Promise<ProfileView> {
    const { name, ...profileChanges } = update

    if (name === undefined && Object.keys(profileChanges).length === 0) {
      throw new BadRequestError('Send at least one field to change')
    }

    const user = await this.load(actor.userId)

    if (Object.keys(profileChanges).length > 0) {
      if (!user.profile) {
        throw new ForbiddenError('Only volunteer accounts have a profile to edit')
      }

      await this.profiles.update(user.id, profileChanges)
    }

    if (name !== undefined) {
      await this.users.updateName(user.id, name)
    }

    return toProfileView(await this.load(actor.userId))
  }

  private async load(userId: string): Promise<UserWithProfile> {
    const user = await this.users.findWithProfile(userId)

    if (!user) {
      throw new NotFoundError('Account no longer exists')
    }

    return user
  }
}
