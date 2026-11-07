import type { ApplicationView, CheckinView, OpportunityView } from './types'

// Shared shapes for the tests. Each one is a complete, valid record, so a test
// only has to say the one field it cares about.

export function makeOpportunity(changes: Partial<OpportunityView> = {}): OpportunityView {
  return {
    id: 'opp-1',
    title: 'River clean up',
    description: 'Clearing the banks of the Nyabugogo.',
    mode: 'PHYSICAL',
    location: 'Kimironko',
    sector: 'Kimironko',
    maxCapacity: 20,
    applicationDeadline: '2026-11-20T00:00:00.000Z',
    startsAt: '2026-11-25T08:00:00.000Z',
    endsAt: null,
    status: 'PUBLISHED',
    reviewNote: null,
    requiredSkills: [],
    categories: [],
    brief: null,
    createdAt: '2026-11-01T00:00:00.000Z',
    creator: { id: 'org-1', name: 'Kimironko Community Kitchen', role: 'ORGANISATION' },
    ...changes,
  }
}

export function makeApplication(volunteerId: string, name: string): ApplicationView {
  return {
    id: `application-${volunteerId}`,
    status: 'ACCEPTED',
    motivationStatement: 'I would like to help.',
    resumeUrl: null,
    createdAt: '2026-11-02T00:00:00.000Z',
    volunteer: {
      id: volunteerId,
      name,
      email: `${volunteerId}@example.rw`,
      avatar: null,
      portfolioSlug: null,
      skills: [],
      interests: [],
      availabilitySlots: [],
      location: null,
    },
    match: { score: 0, sharedSkills: [], sharedInterests: [] },
    opportunity: {
      id: 'opp-1',
      title: 'River clean up',
      applicationDeadline: '2026-11-20T00:00:00.000Z',
      mode: 'PHYSICAL',
    },
  }
}

export function makeCheckin(
  id: string,
  volunteerId: string,
  name: string,
  changes: Partial<CheckinView> = {},
): CheckinView {
  return {
    id,
    method: 'QR',
    checkedInAt: '2026-11-25T08:00:00.000Z',
    checkedOutAt: null,
    hours: null,
    volunteer: { id: volunteerId, name },
    opportunity: { id: 'opp-1', title: 'River clean up' },
    ...changes,
  }
}
