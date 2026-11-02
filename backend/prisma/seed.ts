import { OpportunityMode, OpportunityStatus, UserRole } from '@prisma/client'
import { requireEnv } from '../src/core/config/env'
import { prisma } from '../src/core/database/prisma'
import { PasswordHasher } from '../src/core/security/PasswordHasher'

const accounts = {
  volunteer: {
    name: requireEnv('SEED_VOLUNTEER_NAME'),
    email: requireEnv('SEED_VOLUNTEER_EMAIL').toLowerCase(),
  },
  organisation: {
    name: requireEnv('SEED_ORGANISATION_NAME'),
    email: requireEnv('SEED_ORGANISATION_EMAIL').toLowerCase(),
  },
  admin: {
    name: requireEnv('SEED_ADMIN_NAME'),
    email: requireEnv('SEED_ADMIN_EMAIL').toLowerCase(),
  },
  password: requireEnv('SEED_PASSWORD'),
}

function inDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

function atHour(days: number, hour: number) {
  const when = inDays(days)
  when.setHours(hour, 0, 0, 0)
  return when
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function main() {
  if (accounts.password.length < 8) {
    throw new Error('SEED_PASSWORD must be at least 8 characters')
  }

  const passwordHash = await new PasswordHasher().hash(accounts.password)

  const volunteer = await prisma.user.upsert({
    where: { email: accounts.volunteer.email },
    update: {},
    create: {
      name: accounts.volunteer.name,
      email: accounts.volunteer.email,
      passwordHash,
      role: UserRole.VOLUNTEER,
      profile: {
        create: {
          skills: ['Graphic design', 'Teamwork', 'Communication'],
          interests: ['Environment', 'Education', 'Food access'],
          availability: 'Weekend mornings',
          location: 'Kimironko, Kigali',
          sector: 'Kimironko',
          portfolioSlug: slugify(accounts.volunteer.name),
        },
      },
    },
  })

  const organisation = await prisma.user.upsert({
    where: { email: accounts.organisation.email },
    update: {},
    create: {
      name: accounts.organisation.name,
      email: accounts.organisation.email,
      passwordHash,
      role: UserRole.ORGANISATION,
    },
  })

  await prisma.user.upsert({
    where: { email: accounts.admin.email },
    update: {},
    create: {
      name: accounts.admin.name,
      email: accounts.admin.email,
      passwordHash,
      role: UserRole.ADMIN,
    },
  })

  const opportunities = [
    {
      creatorId: organisation.id,
      title: 'Restore Kimironko wetland path',
      description:
        'Join our neighbourhood team to plant native trees, clear paths and restore the ' +
        'wetland garden. No gardening experience is needed, we provide tools and a short briefing.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Kimironko wetland, Gasabo',
      sector: 'Kimironko',
      maxCapacity: 20,
      applicationDeadline: inDays(7),
      startsAt: atHour(9, 8),
      endsAt: atHour(9, 12),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: ['Teamwork'],
      categories: ['Environment', 'Outdoors'],
    },
    {
      creatorId: organisation.id,
      title: 'Design a community reading guide',
      description: 'Lay out a short guide that volunteers can print and hand to parents.',
      mode: OpportunityMode.VIRTUAL,
      location: null,
      sector: 'Kimironko',
      maxCapacity: 6,
      applicationDeadline: inDays(10),
      startsAt: null,
      endsAt: atHour(17, 23),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: ['Graphic design'],
      categories: ['Education'],
    },
    {
      creatorId: organisation.id,
      title: 'Saturday food parcels',
      description: 'Sort donations and prepare welcoming food parcels for local families.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Kimironko Market hall',
      sector: 'Kimironko',
      maxCapacity: 18,
      applicationDeadline: inDays(12),
      startsAt: atHour(14, 9),
      endsAt: atHour(14, 13),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: ['Teamwork'],
      categories: ['Food access'],
    },
    {
      creatorId: volunteer.id,
      title: 'Kimironko seed swap',
      description:
        'Help neighbours exchange seeds and learn about growing food locally. Volunteers ' +
        'welcome visitors, label seed packets and set up tables at the community garden.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Kimironko community garden',
      sector: 'Kimironko',
      maxCapacity: 15,
      applicationDeadline: inDays(14),
      startsAt: atHour(16, 10),
      endsAt: atHour(16, 13),
      status: OpportunityStatus.PENDING_APPROVAL,
      requiredSkills: ['Teamwork'],
      categories: ['Environment', 'Gardening'],
    },
  ]

  for (const data of opportunities) {
    const existing = await prisma.opportunity.findFirst({ where: { title: data.title } })
    if (!existing) await prisma.opportunity.create({ data })
  }

  console.log('Seeded:')
  console.log(`  ${accounts.volunteer.email} (volunteer)`)
  console.log(`  ${accounts.organisation.email} (organisation)`)
  console.log(`  ${accounts.admin.email} (admin)`)
  console.log(`  ${opportunities.length} opportunities, one awaiting approval`)
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
