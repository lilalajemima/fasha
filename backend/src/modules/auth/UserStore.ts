import type { User, VolunteerProfile } from '@prisma/client'

export type NewAccount = {
  name: string
  email: string
  passwordHash: string
}

export type UserWithProfile = User & { profile: VolunteerProfile | null }

export type AccountChanges = {
  name?: string
  bio?: string | null
  avatar?: string | null
}

export interface UserStore {
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  findWithProfile(id: string): Promise<UserWithProfile | null>
  createVolunteer(account: NewAccount, portfolioSlug: string): Promise<User>
  createOrganisation(account: NewAccount): Promise<User>
  updateAccount(id: string, changes: AccountChanges): Promise<void>
}
