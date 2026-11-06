import {
  ApplicationStatus,
  CheckInMethod,
  OpportunityMode,
  OpportunityStatus,
  SubmissionStatus,
  UserRole,
} from '@prisma/client'
import { requireEnv } from '../src/core/config/env'
import { prisma } from '../src/core/database/prisma'
import { PasswordHasher } from '../src/core/security/PasswordHasher'

/**
 * A demo district that looks like a real one: uneven, local, and with a past as
 * well as a future. Everything is written in Kigali time, which is UTC+2 all
 * year, so the seed reads the same wherever it is run from.
 */

const KIGALI_OFFSET = 2
const DAY = 24 * 60 * 60 * 1000
const SATURDAY = 6

function at(dayOffset: number, hour: number, minute = 0): Date {
  const base = new Date(Date.now() + dayOffset * DAY)

  return new Date(
    Date.UTC(
      base.getUTCFullYear(),
      base.getUTCMonth(),
      base.getUTCDate(),
      hour - KIGALI_OFFSET,
      minute,
    ),
  )
}

/** Umuganda is the last Saturday of the month. The next one, in Kigali time. */
function nextUmuganda(hour: number): Date {
  const now = new Date()

  for (let ahead = 0; ahead < 2; ahead += 1) {
    const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + ahead + 1, 0))
    const back = (last.getUTCDay() - SATURDAY + 7) % 7
    const when = new Date(
      Date.UTC(
        last.getUTCFullYear(),
        last.getUTCMonth(),
        last.getUTCDate() - back,
        hour - KIGALI_OFFSET,
      ),
    )

    if (when.getTime() > Date.now()) return when
  }

  return at(30, hour)
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

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

type Profile = {
  skills: string[]
  interests: string[]
  availabilitySlots: string[]
  location: string
  sector: string
}

const neighbours: { name: string; email: string; profile: Profile }[] = [
  {
    name: 'Uwase Chantal',
    email: 'chantal@fasha.demo',
    profile: {
      skills: ['Teaching and tutoring', 'Public speaking and facilitation'],
      interests: ['Education', 'Youth and children'],
      availabilitySlots: ['MON_AFTERNOON', 'TUE_AFTERNOON', 'WED_AFTERNOON', 'THU_AFTERNOON', 'FRI_AFTERNOON'],
      location: 'Kinyinya, Kigali',
      sector: 'Kinyinya',
    },
  },
  {
    name: 'Habimana Jean-Paul',
    email: 'jeanpaul@fasha.demo',
    profile: {
      skills: ['Construction and manual work', 'First aid'],
      interests: ['Healthcare', 'Climate and environment'],
      availabilitySlots: ['SAT_MORNING', 'SAT_AFTERNOON', 'SUN_MORNING', 'SUN_AFTERNOON'],
      location: 'Remera, Kigali',
      sector: 'Remera',
    },
  },
  {
    name: 'Mukamana Alice',
    email: 'alice@fasha.demo',
    profile: {
      skills: ['Graphic design', 'Photography'],
      interests: ['Education', 'Arts and culture'],
      availabilitySlots: ['MON_EVENING', 'TUE_EVENING', 'WED_EVENING', 'THU_EVENING', 'FRI_EVENING'],
      location: 'Gisozi, Kigali',
      sector: 'Gisozi',
    },
  },
  {
    name: 'Niyonsaba Eric',
    email: 'eric@fasha.demo',
    profile: {
      skills: ['Gardening and planting', 'Construction and manual work'],
      interests: ['Climate and environment', 'Food security and agriculture'],
      availabilitySlots: ['SAT_MORNING'],
      location: 'Kimironko, Kigali',
      sector: 'Kimironko',
    },
  },
  {
    name: 'Iradukunda Sandrine',
    email: 'sandrine@fasha.demo',
    profile: {
      skills: ['Writing and translation'],
      interests: ['Healthcare', 'Education'],
      availabilitySlots: ['SAT_MORNING', 'SAT_AFTERNOON', 'SUN_MORNING', 'WED_EVENING'],
      location: 'Kacyiru, Kigali',
      sector: 'Kacyiru',
    },
  },
]

const partners = [
  { name: 'Gasabo Community Trust', email: 'gasabotrust@fasha.demo' },
  { name: 'Kimironko Parents Association', email: 'kimironkoparents@fasha.demo' },
]

async function main() {
  if (accounts.password.length < 8) {
    throw new Error('SEED_PASSWORD must be at least 8 characters')
  }

  const passwordHash = await new PasswordHasher().hash(accounts.password)

  async function volunteerAccount(name: string, email: string, profile?: Profile) {
    return prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        passwordHash,
        role: UserRole.VOLUNTEER,
        profile: {
          create: {
            skills: profile?.skills ?? ['Graphic design', 'Construction and manual work', 'Public speaking and facilitation'],
            interests: profile?.interests ?? ['Climate and environment', 'Education', 'Food security and agriculture'],
            availabilitySlots: profile?.availabilitySlots ?? ['SAT_MORNING', 'SUN_MORNING'],
            location: profile?.location ?? 'Kimironko, Kigali',
            sector: profile?.sector ?? 'Kimironko',
            portfolioSlug: slugify(name),
          },
        },
      },
    })
  }

  const volunteer = await volunteerAccount(accounts.volunteer.name, accounts.volunteer.email)
  const people = Object.fromEntries(
    await Promise.all(
      neighbours.map(async person => [
        person.email,
        await volunteerAccount(person.name, person.email, person.profile),
      ] as const),
    ),
  )

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

  const [trust, parents] = await Promise.all(
    partners.map(partner =>
      prisma.user.upsert({
        where: { email: partner.email },
        update: {},
        create: {
          name: partner.name,
          email: partner.email,
          passwordHash,
          role: UserRole.ORGANISATION,
        },
      }),
    ),
  )

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

  const chantal = people['chantal@fasha.demo']!
  const jeanPaul = people['jeanpaul@fasha.demo']!
  const alice = people['alice@fasha.demo']!
  const eric = people['eric@fasha.demo']!
  const sandrine = people['sandrine@fasha.demo']!

  const accepted = (volunteerId: string, daysAgo: number, statement: string) => ({
    volunteerId,
    status: ApplicationStatus.ACCEPTED,
    motivationStatement: statement,
    createdAt: at(-daysAgo, 19),
  })

  const waiting = (volunteerId: string, daysAgo: number, statement: string) => ({
    volunteerId,
    status: ApplicationStatus.PENDING,
    motivationStatement: statement,
    createdAt: at(-daysAgo, 20),
  })

  const turnedDown = (volunteerId: string, daysAgo: number, statement: string) => ({
    volunteerId,
    status: ApplicationStatus.REJECTED,
    motivationStatement: statement,
    createdAt: at(-daysAgo, 18),
  })

  const posts = [
    {
      creatorId: organisation.id,
      title: 'Restore the Kimironko wetland path',
      description:
        'Plant native trees, clear the footpath and rebuild the two small bridges on the ' +
        'wetland walk. Tools, gloves and a short briefing are provided. No gardening ' +
        'experience needed, only shoes you do not mind getting muddy.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Kimironko wetland walk',
      sector: 'Kimironko',
      maxCapacity: 20,
      applicationDeadline: at(7, 18),
      startsAt: at(9, 8),
      endsAt: at(9, 12),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: ['Construction and manual work', 'Gardening and planting'],
      categories: ['Climate and environment', 'Sports and recreation'],
      applications: {
        create: [
          accepted(eric.id, 3, 'I live two streets away and I use that path every morning.'),
          accepted(jeanPaul.id, 2, 'I did the river clean-up last year and would like to help again.'),
          waiting(sandrine.id, 1, 'I can bring two friends from the Kacyiru office.'),
        ],
      },
    },
    {
      creatorId: organisation.id,
      title: 'Saturday food parcels',
      description:
        'Sort donations from the market traders and make up parcels for forty families. ' +
        'We work in pairs at long tables, and there is tea halfway through.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Kimironko market hall',
      sector: 'Kimironko',
      maxCapacity: 18,
      applicationDeadline: at(12, 18),
      startsAt: at(14, 9),
      endsAt: at(14, 13),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: ['Construction and manual work'],
      categories: ['Food security and agriculture'],
      applications: {
        create: [
          accepted(eric.id, 4, 'I helped last month and the queue moved much faster with more hands.'),
          waiting(chantal.id, 1, 'Saturdays work well for me.'),
        ],
      },
    },
    {
      creatorId: parents!.id,
      title: 'Read with P3 pupils',
      description:
        'Sit with two pupils each and read through the term reader with them. The school ' +
        'provides the books; you provide patience for an hour and a half.',
      mode: OpportunityMode.PHYSICAL,
      location: 'GS Kinyinya, lower block',
      sector: 'Kinyinya',
      maxCapacity: 6,
      applicationDeadline: at(2, 17),
      startsAt: at(4, 14),
      endsAt: at(4, 16),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: ['Teaching and tutoring', 'Public speaking and facilitation'],
      categories: ['Education', 'Youth and children'],
      applications: {
        create: [
          accepted(chantal.id, 6, 'I teach S1 and I would like to help the younger ones.'),
          accepted(sandrine.id, 5, 'I read with my nieces every week.'),
          accepted(alice.id, 5, 'Happy to take the afternoon off for this.'),
          accepted(jeanPaul.id, 4, 'I can come straight from work.'),
          accepted(eric.id, 4, 'Count me in.'),
          accepted(volunteer.id, 3, 'I would like to try something away from the garden.'),
        ],
      },
    },
    {
      creatorId: trust!.id,
      title: 'Umuganda: clear the Rwandex drain',
      description:
        'The sector team is clearing the blocked drain along the Rwandex road before the ' +
        'heavy rains. Bring a hoe if you have one. We finish with the usual meeting.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Rwandex road, by the junction',
      sector: 'Remera',
      maxCapacity: 40,
      applicationDeadline: at(1, 18),
      startsAt: nextUmuganda(8),
      endsAt: nextUmuganda(11),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: ['Construction and manual work'],
      categories: ['Climate and environment', 'Community infrastructure'],
      applications: {
        create: [
          accepted(jeanPaul.id, 2, 'It is my own street, so I will be there anyway.'),
          waiting(eric.id, 1, 'I can bring a wheelbarrow.'),
        ],
      },
    },
    {
      creatorId: organisation.id,
      title: 'Blood drive stewards',
      description:
        'Guide donors through registration, keep the waiting area calm and hand out juice ' +
        'afterwards. A nurse briefs the team at eight.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Kacyiru health centre',
      sector: 'Kacyiru',
      maxCapacity: 10,
      applicationDeadline: at(0, 23, 30),
      startsAt: at(2, 8, 30),
      endsAt: at(2, 15),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: ['First aid', 'Public speaking and facilitation'],
      categories: ['Healthcare'],
      applications: {
        create: [
          accepted(jeanPaul.id, 2, 'I am a trained first aider at work.'),
          waiting(alice.id, 0, 'I can take the morning off.'),
          turnedDown(eric.id, 1, 'I can only make the afternoon.'),
        ],
      },
    },
    {
      creatorId: parents!.id,
      title: 'Design a community reading guide',
      description:
        'Lay out an eight page guide that parents can print at home, from text we supply. ' +
        'Anything you can export as a PDF is fine.',
      mode: OpportunityMode.VIRTUAL,
      location: null,
      sector: 'Kimironko',
      maxCapacity: 6,
      applicationDeadline: at(10, 18),
      startsAt: null,
      endsAt: at(17, 21),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: ['Graphic design'],
      categories: ['Education'],
      applications: {
        create: [
          accepted(alice.id, 5, 'I lay out the parish newsletter, so this is familiar work.'),
          accepted(volunteer.id, 4, 'I would like something I can do in the evenings.'),
        ],
      },
    },
    {
      creatorId: trust!.id,
      title: 'Translate health leaflets into Kinyarwanda',
      description:
        'Four leaflets on malaria prevention, written in English, need a careful ' +
        'translation that a grandmother would read without stumbling.',
      mode: OpportunityMode.VIRTUAL,
      location: null,
      sector: 'Gisozi',
      maxCapacity: 8,
      applicationDeadline: at(20, 18),
      startsAt: null,
      endsAt: at(25, 21),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: ['Writing and translation'],
      categories: ['Healthcare'],
      applications: {
        create: [
          accepted(sandrine.id, 7, 'I translate for the clinic already.'),
          waiting(chantal.id, 2, 'My Kinyarwanda writing is strong.'),
        ],
      },
    },
    {
      creatorId: trust!.id,
      title: 'Edit photographs from the Ndera tree nursery',
      description:
        'Two hundred photographs from the nursery open day need choosing, cropping and ' +
        'light correction for the annual report.',
      mode: OpportunityMode.VIRTUAL,
      location: null,
      sector: 'Ndera',
      maxCapacity: 3,
      applicationDeadline: at(9, 18),
      startsAt: null,
      endsAt: at(12, 21),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: ['Photography', 'Graphic design'],
      categories: ['Climate and environment', 'Arts and culture'],
      applications: { create: [waiting(alice.id, 1, 'I shoot and edit for the camera club.')] },
    },
    {
      creatorId: organisation.id,
      title: 'Clean-up at Kimironko market',
      description:
        'The monthly sweep of the market surrounds: litter, drains and the loading bay.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Kimironko market, east gate',
      sector: 'Kimironko',
      maxCapacity: 15,
      applicationDeadline: at(-16, 18),
      startsAt: at(-14, 8),
      endsAt: at(-14, 11),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: ['Construction and manual work'],
      categories: ['Climate and environment'],
      applications: {
        create: [
          accepted(eric.id, 18, 'I come every month.'),
          accepted(jeanPaul.id, 18, 'Happy to take the loading bay again.'),
          accepted(chantal.id, 17, 'First time for me.'),
          accepted(volunteer.id, 17, 'I can bring bags.'),
        ],
      },
      checkins: {
        create: [
          {
            volunteerId: eric.id,
            method: CheckInMethod.QR,
            checkinTime: at(-14, 7, 54),
            checkoutTime: at(-14, 11, 6),
          },
          {
            volunteerId: jeanPaul.id,
            method: CheckInMethod.QR,
            checkinTime: at(-14, 8, 2),
            checkoutTime: at(-14, 11, 0),
          },
          {
            volunteerId: chantal.id,
            method: CheckInMethod.MANUAL,
            checkinTime: at(-14, 8, 21),
            checkoutTime: at(-14, 10, 45),
          },
          {
            volunteerId: volunteer.id,
            method: CheckInMethod.QR,
            checkinTime: at(-14, 8, 5),
            checkoutTime: at(-14, 11, 12),
          },
        ],
      },
      portfolioEntries: {
        create: [
          { volunteerId: eric.id, hoursCredited: 3.2, skillsCredited: ['Construction and manual work'], dateCredited: at(-14, 11) },
          { volunteerId: jeanPaul.id, hoursCredited: 2.97, skillsCredited: ['Construction and manual work'], dateCredited: at(-14, 11) },
          { volunteerId: chantal.id, hoursCredited: 2.4, skillsCredited: ['Construction and manual work'], dateCredited: at(-14, 11) },
          { volunteerId: volunteer.id, hoursCredited: 3.12, skillsCredited: ['Construction and manual work'], dateCredited: at(-14, 11) },
        ],
      },
    },
    {
      creatorId: trust!.id,
      title: 'Poster for the Gisozi health talk',
      description: 'One A3 poster for a talk on clean water, in Kinyarwanda and English.',
      mode: OpportunityMode.VIRTUAL,
      location: null,
      sector: 'Gisozi',
      maxCapacity: 4,
      applicationDeadline: at(-10, 18),
      startsAt: null,
      endsAt: at(-7, 21),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: ['Graphic design'],
      categories: ['Healthcare'],
      applications: {
        create: [
          accepted(alice.id, 14, 'I can do this over a weekend.'),
          accepted(volunteer.id, 13, 'I would like the practice.'),
        ],
      },
      taskSubmissions: {
        create: [
          {
            volunteerId: alice.id,
            hoursClaimed: 4,
            proofUrl: 'https://example.com/fasha/gisozi-poster.pdf',
            status: SubmissionStatus.APPROVED,
            createdAt: at(-8, 20),
          },
          {
            volunteerId: volunteer.id,
            hoursClaimed: 3,
            proofUrl: 'https://example.com/fasha/gisozi-poster-draft.pdf',
            status: SubmissionStatus.PENDING,
            createdAt: at(-7, 22),
          },
        ],
      },
      portfolioEntries: {
        create: [
          {
            volunteerId: alice.id,
            hoursCredited: 4,
            skillsCredited: ['Graphic design'],
            dateCredited: at(-8, 21),
          },
        ],
      },
    },
    {
      creatorId: volunteer.id,
      title: 'Kimironko seed swap',
      description:
        'Neighbours bring seeds they have saved and swap them at the community garden. ' +
        'Volunteers welcome visitors, label packets and keep the tables tidy.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Kimironko community garden',
      sector: 'Kimironko',
      maxCapacity: 15,
      applicationDeadline: at(14, 18),
      startsAt: at(16, 10),
      endsAt: at(16, 13),
      status: OpportunityStatus.PENDING_APPROVAL,
      requiredSkills: ['Construction and manual work', 'Gardening and planting'],
      categories: ['Climate and environment', 'Food security and agriculture'],
    },
    {
      creatorId: eric.id,
      title: 'Night football tournament',
      description: 'A five a side tournament on the sector pitch over a weekend.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Kimironko sector pitch',
      sector: 'Kimironko',
      maxCapacity: 30,
      applicationDeadline: at(30, 18),
      startsAt: at(45, 19),
      endsAt: at(45, 23),
      status: OpportunityStatus.REJECTED,
      reviewNote: 'The pitch has no lighting after seven. Please propose a daytime slot.',
      reviewedAt: at(-2, 11),
      requiredSkills: ['Construction and manual work'],
      categories: ['Sports and recreation'],
    },
  ]

  let created = 0

  for (const post of posts) {
    const existing = await prisma.opportunity.findFirst({ where: { title: post.title } })

    if (existing) continue

    await prisma.opportunity.create({ data: post })
    created += 1
  }

  console.log('Seeded:')
  console.log(`  ${accounts.volunteer.email} (volunteer)`)
  console.log(`  ${accounts.organisation.email} (organisation)`)
  console.log(`  ${accounts.admin.email} (admin)`)
  console.log(`  ${neighbours.length} neighbours and ${partners.length} partner organisations`)
  console.log(`  ${created} of ${posts.length} opportunities created, the rest were already there`)
  console.log('  one awaiting review, one not approved, two already finished')
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
