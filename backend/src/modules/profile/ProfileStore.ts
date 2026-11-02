export type ProfileChanges = {
  skills?: string[]
  interests?: string[]
  availability?: string | null
  location?: string | null
  sector?: string | null
}

export type PortfolioOwner = {
  userId: string
  name: string
  portfolioSlug: string
}

export interface ProfileStore {
  update(userId: string, changes: ProfileChanges): Promise<void>
  findByUserId(userId: string): Promise<PortfolioOwner | null>
  findBySlug(slug: string): Promise<PortfolioOwner | null>
}
