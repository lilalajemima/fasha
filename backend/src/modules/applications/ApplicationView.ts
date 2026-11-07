import { MatchingService } from '../matching/MatchingService'
import type { ApplicationRecord } from './ApplicationStore'

const matching = new MatchingService()

export type ApplicationView = {
  id: string
  status: string
  motivationStatement: string
  resumeUrl: string | null
  createdAt: string
  volunteer: {
    id: string
    name: string
    email: string
    avatar: string | null
    portfolioSlug: string | null
    skills: string[]
    interests: string[]
    availabilitySlots: string[]
    location: string | null
  }
  // How well this applicant fits this opportunity, 0 to 100, by the same
  // weighting Discover uses in the other direction. The shared tags travel
  // with it because a percentage on its own tells an organiser nothing about
  // why one applicant is above another.
  match: {
    score: number
    sharedSkills: string[]
    sharedInterests: string[]
  }
  opportunity: { id: string; title: string; applicationDeadline: string; mode: string }
}

function shared(mine: string[], theirs: string[]): string[] {
  const wanted = new Set(theirs.map(tag => tag.trim().toLowerCase()))

  return mine.filter(tag => wanted.has(tag.trim().toLowerCase()))
}

export function toApplicationView(record: ApplicationRecord): ApplicationView {
  const profile = record.volunteer.profile
  const skills = profile?.skills ?? []
  const interests = profile?.interests ?? []

  return {
    id: record.id,
    status: record.status,
    motivationStatement: record.motivationStatement,
    resumeUrl: record.resumeUrl,
    createdAt: record.createdAt.toISOString(),
    volunteer: {
      id: record.volunteer.id,
      name: record.volunteer.name,
      email: record.volunteer.email,
      avatar: record.volunteer.avatar,
      portfolioSlug: profile?.portfolioSlug ?? null,
      skills,
      interests,
      availabilitySlots: profile?.availabilitySlots ?? [],
      location: profile?.location ?? null,
    },
    match: {
      score: matching.score(
        { skills, interests },
        {
          requiredSkills: record.opportunity.requiredSkills,
          categories: record.opportunity.categories,
        },
      ),
      sharedSkills: shared(skills, record.opportunity.requiredSkills),
      sharedInterests: shared(interests, record.opportunity.categories),
    },
    opportunity: {
      id: record.opportunity.id,
      title: record.opportunity.title,
      applicationDeadline: record.opportunity.applicationDeadline.toISOString(),
      mode: record.opportunity.mode,
    },
  }
}
