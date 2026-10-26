import type { UserWithProfile } from '../auth/UserStore'

export type ProfileView = {
  user: { id: string; name: string; email: string; role: string }
  profile: {
    skills: string[]
    interests: string[]
    availability: string | null
    location: string | null
    portfolioSlug: string
  } | null
}

export function toProfileView(user: UserWithProfile): ProfileView {
  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    profile: user.profile
      ? {
          skills: user.profile.skills,
          interests: user.profile.interests,
          availability: user.profile.availability,
          location: user.profile.location,
          portfolioSlug: user.profile.portfolioSlug,
        }
      : null,
  }
}
