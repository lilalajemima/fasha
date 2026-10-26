export type ProfileChanges = {
  skills?: string[]
  interests?: string[]
  availability?: string | null
  location?: string | null
}

export interface ProfileStore {
  update(userId: string, changes: ProfileChanges): Promise<void>
}
