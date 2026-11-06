export type ProfileChanges = {
  skills?: string[]
  interests?: string[]
  availabilitySlots?: string[]
  location?: string | null
  sector?: string | null
}

export type PortfolioOwner = {
  userId: string
  name: string
  portfolioSlug: string
  avatar: string | null
  bio: string | null
  skills: string[]
  interests: string[]
  availabilitySlots: string[]
}

export interface ProfileStore {
  update(userId: string, changes: ProfileChanges): Promise<void>
  findByUserId(userId: string): Promise<PortfolioOwner | null>
  findBySlug(slug: string): Promise<PortfolioOwner | null>
}
