import { describe, expect, it } from 'vitest'
import { BadRequestError, ForbiddenError } from '../../core/errors/HttpErrors'
import type { NewAccount, UserStore, UserWithProfile } from '../auth/UserStore'
import { ProfileService } from './ProfileService'
import type { ProfileChanges, ProfileStore } from './ProfileStore'

class FakeUserStore implements UserStore {
  constructor(private readonly user: UserWithProfile) {}

  async findByEmail() {
    return null
  }

  async findById() {
    return null
  }

  async findWithProfile() {
    return this.user
  }

  async createVolunteer(_account: NewAccount, _portfolioSlug: string): Promise<never> {
    throw new Error('not needed in this test')
  }

  async createOrganisation(_account: NewAccount): Promise<never> {
    throw new Error('not needed in this test')
  }

  async updateName(_id: string, name: string) {
    this.user.name = name
  }
}

class FakeProfileStore implements ProfileStore {
  constructor(private readonly profile: Record<string, unknown> | null) {}

  async update(_userId: string, changes: ProfileChanges) {
    if (this.profile) Object.assign(this.profile, changes)
  }
}

function buildVolunteer(): UserWithProfile {
  return {
    id: 'volunteer-1',
    name: 'Amara Mensah',
    email: 'amara@example.com',
    role: 'VOLUNTEER',
    profile: {
      skills: ['Teamwork'],
      interests: ['Environment'],
      availability: null,
      location: null,
      portfolioSlug: 'amara-mensah',
    },
  } as unknown as UserWithProfile
}

function buildOrganisation(): UserWithProfile {
  return {
    id: 'organisation-1',
    name: 'Green Neighbourhood',
    email: 'green@example.com',
    role: 'ORGANISATION',
    profile: null,
  } as unknown as UserWithProfile
}

function serviceFor(user: UserWithProfile) {
  return new ProfileService(
    new FakeUserStore(user),
    new FakeProfileStore(user.profile as unknown as Record<string, unknown> | null),
  )
}

const volunteerToken = { userId: 'volunteer-1', role: 'VOLUNTEER' }
const organisationToken = { userId: 'organisation-1', role: 'ORGANISATION' }

describe('updating a profile', () => {
  it('saves new skills and interests', async () => {
    const user = buildVolunteer()
    const view = await serviceFor(user).update(volunteerToken, {
      skills: ['Graphic design', 'Teamwork'],
      interests: ['Education'],
    })

    expect(view.profile?.skills).toEqual(['Graphic design', 'Teamwork'])
    expect(view.profile?.interests).toEqual(['Education'])
  })

  it('clears a field when it is sent as null', async () => {
    const user = buildVolunteer()
    const view = await serviceFor(user).update(volunteerToken, { location: null })

    expect(view.profile?.location).toBeNull()
  })

  it('changes the name on the account, not the profile', async () => {
    const user = buildVolunteer()
    const view = await serviceFor(user).update(volunteerToken, { name: 'Amara M' })

    expect(view.user.name).toBe('Amara M')
  })

  it('refuses an empty request', async () => {
    const service = serviceFor(buildVolunteer())

    await expect(service.update(volunteerToken, {})).rejects.toThrow(BadRequestError)
  })

  it('stops an organisation setting volunteer skills', async () => {
    const service = serviceFor(buildOrganisation())

    await expect(
      service.update(organisationToken, { skills: ['Teamwork'] }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('still lets an organisation rename itself', async () => {
    const user = buildOrganisation()
    const view = await serviceFor(user).update(organisationToken, { name: 'Green Kigali' })

    expect(view.user.name).toBe('Green Kigali')
    expect(view.profile).toBeNull()
  })
})
