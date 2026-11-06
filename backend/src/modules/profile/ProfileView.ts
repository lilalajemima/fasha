import type { UserWithProfile } from '../auth/UserStore'

export type ProfileView = {
  user: {
    id: string
    name: string
    email: string
    role: string
    status: string
    mustChangePassword: boolean
    avatar: string | null
    bio: string | null
  }
  profile: {
    skills: string[]
    interests: string[]
    availabilitySlots: string[]
    location: string | null
    sector: string | null
    portfolioSlug: string
  } | null
}

export function toProfileView(user: UserWithProfile): ProfileView {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      avatar: user.avatar,
      bio: user.bio,
    },
    profile: user.profile
      ? {
          skills: user.profile.skills,
          interests: user.profile.interests,
          availabilitySlots: user.profile.availabilitySlots,
          location: user.profile.location,
          sector: user.profile.sector,
          portfolioSlug: user.profile.portfolioSlug,
        }
      : null,
  }
}
