import { PrismaPg } from '@prisma/adapter-pg'
import { type OpportunityMode, type OpportunityStatus, PrismaClient, type UserRole } from '@prisma/client'
import { isLocalDatabase } from './localDatabase'

// Only for the *.db.test.ts files, which `npm run test:db` runs against a
// throwaway database. Nothing here is part of the API.

export function connect(): PrismaClient {
  const url = process.env.TEST_DATABASE_URL

  if (!isLocalDatabase(url)) {
    throw new Error('TEST_DATABASE_URL has to be a database on this computer. See the README.')
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
}

// Every table hangs off users, so this one statement empties the lot.
export async function emptyDatabase(db: PrismaClient): Promise<void> {
  await db.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE')
}

let made = 0

export async function makeUser(
  db: PrismaClient,
  overrides: { name?: string; email?: string; role?: UserRole; passwordHash?: string | null; googleId?: string | null; status?: 'ACTIVE' | 'DEACTIVATED' | 'DELETED' } = {},
) {
  made += 1

  return db.user.create({
    data: {
      name: overrides.name ?? `Person ${made}`,
      email: overrides.email ?? `person-${made}@example.invalid`,
      passwordHash: overrides.passwordHash === undefined ? 'hash' : overrides.passwordHash,
      googleId: overrides.googleId ?? null,
      role: overrides.role ?? 'VOLUNTEER',
      status: overrides.status ?? 'ACTIVE',
    },
  })
}

export async function makeOpportunity(
  db: PrismaClient,
  creatorId: string,
  overrides: {
    title?: string
    description?: string
    mode?: OpportunityMode
    sector?: string
    status?: OpportunityStatus
    maxCapacity?: number
    applicationDeadline?: Date
    startsAt?: Date | null
    endsAt?: Date
    createdAt?: Date
  } = {},
) {
  made += 1

  const startsAt = overrides.startsAt === undefined ? new Date(Date.now() + 7 * 86_400_000) : overrides.startsAt

  return db.opportunity.create({
    data: {
      creatorId,
      title: overrides.title ?? `Opportunity ${made}`,
      description: overrides.description ?? 'Work with the neighbourhood.',
      mode: overrides.mode ?? 'PHYSICAL',
      location: (overrides.mode ?? 'PHYSICAL') === 'PHYSICAL' ? 'Kimironko market' : null,
      sector: overrides.sector ?? 'Kimironko',
      status: overrides.status ?? 'PUBLISHED',
      maxCapacity: overrides.maxCapacity ?? 10,
      applicationDeadline: overrides.applicationDeadline ?? new Date(Date.now() + 5 * 86_400_000),
      startsAt,
      endsAt: overrides.endsAt ?? new Date((startsAt ?? new Date()).getTime() + 4 * 3_600_000),
      ...(overrides.createdAt ? { createdAt: overrides.createdAt } : {}),
    },
  })
}

export async function apply(
  db: PrismaClient,
  opportunityId: string,
  volunteerId: string,
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' = 'PENDING',
) {
  return db.application.create({
    data: { opportunityId, volunteerId, motivationStatement: 'I live nearby.', status },
  })
}
