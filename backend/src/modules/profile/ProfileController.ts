import type { Request, Response } from 'express'
import { INTERESTS, SKILLS } from '../../core/domain/catalogue'
import {
  readAvailability,
  hasField,
  readOptionalImage,
  readOptionalSector,
  readShortText,
  readString,
  readTagList,
} from '../../core/validation/readers'
import type { ProfileService, ProfileUpdate } from './ProfileService'

const MAX_TEXT_LENGTH = 120
const MAX_BIO_LENGTH = 600

export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  update = async (req: Request, res: Response) => {
    res.json(await this.profiles.update(req.user!, this.changesFrom(req.body)))
  }

  private changesFrom(body: Record<string, unknown>): ProfileUpdate {
    const update: ProfileUpdate = {}

    if (hasField(body, 'name')) update.name = readString(body, 'name', 2)
    if (hasField(body, 'bio')) update.bio = readShortText(body, 'bio', MAX_BIO_LENGTH)
    if (hasField(body, 'avatar')) update.avatar = readOptionalImage(body, 'avatar')
    if (hasField(body, 'skills')) update.skills = readTagList(body, 'skills', SKILLS)
    if (hasField(body, 'interests')) update.interests = readTagList(body, 'interests', INTERESTS)

    if (hasField(body, 'availabilitySlots')) {
      update.availabilitySlots = readAvailability(body, 'availabilitySlots')
    }

    if (hasField(body, 'location')) {
      update.location = readShortText(body, 'location', MAX_TEXT_LENGTH)
    }

    if (hasField(body, 'sector')) {
      update.sector = readOptionalSector(body, 'sector')
    }

    return update
  }
}
