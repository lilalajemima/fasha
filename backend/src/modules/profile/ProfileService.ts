import { BadRequestError, ForbiddenError, NotFoundError } from '../../core/errors/HttpErrors'
import type { TokenPayload } from '../../core/security/TokenService'
import type { AccountChanges, UserStore, UserWithProfile } from '../auth/UserStore'
import type { ProfileChanges, ProfileStore } from './ProfileStore'
import { toProfileView, type ProfileView } from './ProfileView'

export type ProfileUpdate = ProfileChanges & AccountChanges

export class ProfileService {
  constructor(
    private readonly users: UserStore,
    private readonly profiles: ProfileStore,
  ) {}

  // Name, picture and bio belong to every account. Skills, availability and
  // the rest describe a volunteer, so an organisation sending them is refused
  // rather than quietly ignored.
  async update(actor: TokenPayload, update: ProfileUpdate): Promise<ProfileView> {
    const { name, bio, avatar, ...profileChanges } = update
    const accountChanges: AccountChanges = {
      ...(name === undefined ? {} : { name }),
      ...(bio === undefined ? {} : { bio }),
      ...(avatar === undefined ? {} : { avatar }),
    }

    if (Object.keys(accountChanges).length === 0 && Object.keys(profileChanges).length === 0) {
      throw new BadRequestError('Send at least one field to change')
    }

    const user = await this.load(actor.userId)

    if (Object.keys(profileChanges).length > 0) {
      if (!user.profile) {
        throw new ForbiddenError('Only volunteer accounts have skills and availability')
      }

      await this.profiles.update(user.id, profileChanges)
    }

    if (Object.keys(accountChanges).length > 0) {
      await this.users.updateAccount(user.id, accountChanges)
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
