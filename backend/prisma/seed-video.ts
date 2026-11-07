import {
  ApplicationStatus,
  CheckInMethod,
  OpportunityMode,
  OpportunityStatus,
  SubmissionStatus,
  UserRole,
} from '@prisma/client'
import { prisma } from '../src/core/database/prisma'
import { PasswordHasher } from '../src/core/security/PasswordHasher'

/**
 * The state the walkthrough video needs, and nothing else.
 *
 * Separate from seed.ts because recording consumes state: approving the
 * football initiative, rejecting the deliverable and checking Shema in all
 * spend something that took time to set up. This script deletes its own five
 * accounts first, so running it again between takes rebuilds everything in a
 * few seconds rather than forty minutes of clicking.
 *
 * The tag sets are chosen rather than typed out. Keza's feed ranks 83, 78, 28,
 * 16 and 13 per cent, which shows the matching doing something. Tags picked at
 * random give five scores in the sixties, which shows nothing.
 */

const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000
const KIGALI_OFFSET = 2
const SATURDAY = 6

const PASSWORD = process.env.VIDEO_SEED_PASSWORD ?? 'Fasha-Demo-2026'
const DOMAIN = 'video.fasha.demo'

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

function fromNow(hours: number): Date {
  return new Date(Date.now() + hours * HOUR)
}

/** The most recent last-Saturday-of-the-month that has already passed. */
function lastUmuganda(hour: number): Date {
  const now = new Date()

  for (let back = 0; back < 3; back += 1) {
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back + 1, 0))
    const step = (end.getUTCDay() - SATURDAY + 7) % 7
    const when = new Date(
      Date.UTC(
        end.getUTCFullYear(),
        end.getUTCMonth(),
        end.getUTCDate() - step,
        hour - KIGALI_OFFSET,
      ),
    )

    if (when.getTime() < Date.now()) return when
  }

  return at(-30, hour)
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const cast = {
  keza: {
    name: 'Keza Uwimana',
    email: `keza@${DOMAIN}`,
    bio: 'I tutor Senior 6 students in Kimironko on weekday afternoons.',
    profile: {
      skills: [
        'Teaching and tutoring',
        'Public speaking and facilitation',
        'Social media and communications',
      ],
      interests: ['Education', 'Youth and children'],
      availabilitySlots: ['MON_AFTERNOON', 'WED_AFTERNOON', 'FRI_AFTERNOON', 'SAT_MORNING'],
      location: 'Kimironko, Kigali',
      sector: 'Kimironko',
    },
  },
  shema: {
    name: 'Shema Nkurunziza',
    email: `shema@${DOMAIN}`,
    bio: 'Photographer. I shoot community events and edit for the camera club.',
    profile: {
      skills: ['Photography', 'Graphic design', 'Social media and communications'],
      interests: ['Arts and culture', 'Youth and children'],
      availabilitySlots: ['SAT_MORNING', 'SAT_AFTERNOON', 'SUN_AFTERNOON'],
      location: 'Kimironko, Kigali',
      sector: 'Kimironko',
    },
  },
  ineza: {
    name: 'Ineza Mukamana',
    email: `ineza@${DOMAIN}`,
    bio: 'I keep the community garden going and organise the seed swaps.',
    profile: {
      skills: ['Gardening and planting', 'Event planning'],
      interests: ['Climate and environment', 'Community infrastructure'],
      availabilitySlots: ['SAT_MORNING', 'SUN_MORNING'],
      location: 'Bumbogo, Kigali',
      sector: 'Bumbogo',
    },
  },
  aline: {
    name: 'Aline Uwamahoro',
    email: `aline@${DOMAIN}`,
    bio: 'I translate for the health centre and help with reading groups.',
    profile: {
      skills: ['Teaching and tutoring', 'Writing and translation'],
      interests: ['Education', 'Healthcare', "Women's empowerment"],
      availabilitySlots: ['TUE_AFTERNOON', 'THU_AFTERNOON', 'SAT_MORNING'],
      location: 'Kimironko, Kigali',
      sector: 'Kimironko',
    },
  },
  patrick: {
    name: 'Patrick Nsengimana',
    email: `patrick@${DOMAIN}`,
    bio: 'I film and edit for the youth centre.',
    profile: {
      skills: ['Social media and communications', 'Videography'],
      interests: ['Technology and digital skills', 'Youth and children'],
      availabilitySlots: ['MON_EVENING', 'WED_EVENING', 'SAT_AFTERNOON'],
      location: 'Remera, Kigali',
      sector: 'Remera',
    },
  },
  divine: {
    name: 'Divine Umutoni',
    email: `divine@${DOMAIN}`,
    bio: 'Trained first aider. I steward at the health centre on Saturdays.',
    profile: {
      skills: ['First aid', 'Public speaking and facilitation'],
      interests: ['Healthcare', 'Youth and children'],
      availabilitySlots: ['SAT_MORNING', 'SAT_AFTERNOON', 'SUN_MORNING'],
      location: 'Bumbogo, Kigali',
      sector: 'Bumbogo',
    },
  },
  organisation: { name: 'Isoko Youth Network', email: `isoko@${DOMAIN}` },
  admin: { name: 'Mugisha Rwema', email: `mugisha@${DOMAIN}` },
}

const everyone = Object.values(cast).map(person => person.email)

async function main() {
  await prisma.user.deleteMany({ where: { email: { in: everyone } } })

  const passwordHash = await new PasswordHasher().hash(PASSWORD)

  const volunteer = (person: typeof cast.keza) =>
    prisma.user.create({
      data: {
        name: person.name,
        email: person.email,
        bio: person.bio,
        passwordHash,
        role: UserRole.VOLUNTEER,
        profile: { create: { ...person.profile, portfolioSlug: slugify(person.name) } },
      },
    })

  const keza = await volunteer(cast.keza)
  const shema = await volunteer(cast.shema)
  const ineza = await volunteer(cast.ineza)
  const aline = await volunteer(cast.aline)
  const patrick = await volunteer(cast.patrick)
  const divine = await volunteer(cast.divine)

  const isoko = await prisma.user.create({
    data: {
      name: cast.organisation.name,
      email: cast.organisation.email,
      bio: 'We run tutoring, reading and health programmes across Gasabo.',
      passwordHash,
      role: UserRole.ORGANISATION,
    },
  })

  await prisma.user.create({
    data: {
      name: cast.admin.name,
      email: cast.admin.email,
      passwordHash,
      role: UserRole.ADMIN,
    },
  })

  const applied = (
    volunteerId: string,
    status: ApplicationStatus,
    daysAgo: number,
    motivationStatement: string,
  ) => ({ volunteerId, status, motivationStatement, createdAt: at(-daysAgo, 19) })

  // Section A5. Open for check-in while you record, so the window is wide.
  await prisma.opportunity.create({
    data: {
      creatorId: isoko.id,
      title: 'Exam revision tutoring, Senior 6',
      description:
        'Sit with a group of four and work through past papers in maths and physics. ' +
        'We supply the papers and the room; you supply three hours and the patience to ' +
        'explain the same step twice.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Kimironko public library, upstairs room',
      sector: 'Kimironko',
      maxCapacity: 8,
      // The feed only shows opportunities whose deadline has not passed, so this
      // stays open while you record. Otherwise the 83% match disappears from Discover.
      applicationDeadline: fromNow(3),
      startsAt: fromNow(-1),
      endsAt: fromNow(4),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: [
        'Teaching and tutoring',
        'Public speaking and facilitation',
        'Social media and communications',
      ],
      categories: ['Education'],
      applications: {
        create: [
          applied(shema.id, ApplicationStatus.ACCEPTED, 4, 'I did this last term and the group asked me back.'),
          applied(aline.id, ApplicationStatus.ACCEPTED, 4, 'I can take the maths group.'),
          applied(divine.id, ApplicationStatus.ACCEPTED, 3, 'Happy to help with physics.'),
          applied(patrick.id, ApplicationStatus.ACCEPTED, 3, 'I sat these papers two years ago.'),
        ],
      },
    },
  })

  // Section A3. Keza applies to this one on camera, so leave it empty.
  await prisma.opportunity.create({
    data: {
      creatorId: isoko.id,
      title: 'After-school reading club, Kimironko',
      description:
        'Read with two P4 pupils each for an hour and a half, twice a week. The school ' +
        'provides the term reader. Most of the work is listening.',
      mode: OpportunityMode.PHYSICAL,
      location: 'GS Kimironko, lower block',
      sector: 'Kimironko',
      maxCapacity: 12,
      applicationDeadline: at(7, 18),
      startsAt: at(9, 15),
      endsAt: at(9, 17),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: ['Teaching and tutoring', 'Public speaking and facilitation'],
      categories: ['Education', 'Youth and children'],
      // Two waiting already, so when Keza applies on camera she lands at the top
      // of a ranked list rather than being the only name on it.
      applications: {
        create: [
          applied(aline.id, ApplicationStatus.PENDING, 2, 'I read with my nieces every week.'),
          applied(patrick.id, ApplicationStatus.PENDING, 1, 'I could film a short piece about it too.'),
        ],
      },
    },
  })

  // Sections A6 and C. Virtual, so hours come from a submission rather than a register.
  await prisma.opportunity.create({
    data: {
      creatorId: isoko.id,
      title: 'Health campaign content for social media',
      description:
        'Six posts on malaria prevention for the rainy season, in Kinyarwanda and ' +
        'English. We supply the facts and the brand colours; you lay them out.',
      mode: OpportunityMode.VIRTUAL,
      location: null,
      sector: 'Kimironko',
      maxCapacity: 8,
      applicationDeadline: at(10, 18),
      startsAt: null,
      endsAt: at(14, 21),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: ['Social media and communications', 'Graphic design'],
      categories: ['Healthcare', 'Youth and children'],
      applications: {
        create: [
          applied(shema.id, ApplicationStatus.ACCEPTED, 6, 'I lay out the camera club newsletter every month.'),
          applied(keza.id, ApplicationStatus.ACCEPTED, 5, 'I write the tutoring group posts, so the tone is familiar.'),
          applied(aline.id, ApplicationStatus.ACCEPTED, 5, 'I can do the Kinyarwanda versions.'),
          applied(divine.id, ApplicationStatus.PENDING, 2, 'I know the malaria guidance well from the clinic.'),
          applied(patrick.id, ApplicationStatus.PENDING, 1, 'I can cut a short video alongside the posts.'),
        ],
      },
      // One of each state, so the deliverables list is worth filtering on camera.
      taskSubmissions: {
        create: [
          {
            volunteerId: keza.id,
            hoursClaimed: 5,
            proofUrl: 'https://example.com/fasha/malaria-posts-draft.pdf',
            status: SubmissionStatus.PENDING,
            createdAt: at(-1, 20),
          },
          {
            volunteerId: shema.id,
            hoursClaimed: 6.5,
            proofUrl: 'https://example.com/fasha/malaria-posts-final.pdf',
            status: SubmissionStatus.APPROVED,
            createdAt: at(-4, 21),
          },
          {
            volunteerId: aline.id,
            hoursClaimed: 12,
            proofUrl: 'https://example.com/fasha/kinyarwanda-drafts.pdf',
            status: SubmissionStatus.REJECTED,
            reviewNote: 'Twelve hours for two posts does not match what we agreed. Please resubmit with the time you actually spent.',
            createdAt: at(-3, 20),
          },
        ],
      },
      portfolioEntries: {
        create: [
          {
            volunteerId: shema.id,
            hoursCredited: 6.5,
            skillsCredited: ['Social media and communications', 'Graphic design'],
            dateCredited: at(-4, 21),
          },
        ],
      },
    },
  })

  // Section C. Capacity of one, already taken, so Keza's application is refused.
  await prisma.opportunity.create({
    data: {
      creatorId: isoko.id,
      title: 'Tree planting at Bumbogo primary school',
      description:
        'Plant forty seedlings along the school boundary and water them in. One person ' +
        'only this round, because the school can host one visitor at a time.',
      mode: OpportunityMode.PHYSICAL,
      location: 'EP Bumbogo, east fence',
      sector: 'Bumbogo',
      maxCapacity: 1,
      applicationDeadline: at(4, 18),
      startsAt: at(5, 8),
      endsAt: at(5, 11),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: ['Gardening and planting', 'Teaching and tutoring'],
      categories: ['Climate and environment'],
      // Capacity is checked when the organiser accepts, not when somebody applies.
      // Ineza holds the only place and Divine is waiting, so accepting Divine on
      // camera fails with "Every place on that opportunity is taken".
      applications: {
        create: [
          applied(ineza.id, ApplicationStatus.ACCEPTED, 3, 'I grew most of those seedlings, so I should plant them.'),
          applied(divine.id, ApplicationStatus.PENDING, 1, 'I can come early and help water them in.'),
        ],
      },
    },
  })

  // Section A2. The bottom of the feed, so the ranking has a visible range.
  await prisma.opportunity.create({
    data: {
      creatorId: isoko.id,
      title: 'Bookkeeping clinic for market traders',
      description:
        'Sit with traders at the market office and set up a simple cash book each. ' +
        'Bring a calculator.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Kimironko market, office block',
      sector: 'Kimironko',
      maxCapacity: 6,
      applicationDeadline: at(11, 18),
      startsAt: at(13, 9),
      endsAt: at(13, 12),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: [
        'Accounting and bookkeeping',
        'Data entry and analysis',
        'Teaching and tutoring',
      ],
      categories: ['Entrepreneurship', "Women's empowerment"],
      applications: {
        create: [
          applied(patrick.id, ApplicationStatus.PENDING, 2, 'I keep the books for my mother\u2019s shop.'),
          applied(divine.id, ApplicationStatus.REJECTED, 4, 'I can only make the afternoon.'),
        ],
      },
    },
  })

  // Section A4. The admin approves this on camera, so leave it pending.
  await prisma.opportunity.create({
    data: {
      creatorId: ineza.id,
      title: 'Saturday football coaching for girls',
      description:
        'Six Saturdays of coaching for girls aged 10 to 14 on the sector pitch. We need ' +
        'people to run drills, keep score and walk the youngest ones home.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Kimironko sector pitch',
      sector: 'Kimironko',
      maxCapacity: 20,
      applicationDeadline: at(10, 18),
      startsAt: at(12, 9),
      endsAt: at(12, 12),
      status: OpportunityStatus.PENDING_APPROVAL,
      requiredSkills: [
        'Event planning',
        'Public speaking and facilitation',
        'Teaching and tutoring',
      ],
      categories: ['Sports and recreation', 'Youth and children'],
    },
  })

  // Section A7. Where Keza's verified hours come from.
  const umuganda = lastUmuganda(8)
  const umugandaEnd = new Date(umuganda.getTime() + 3 * HOUR)

  await prisma.opportunity.create({
    data: {
      creatorId: isoko.id,
      title: 'Umuganda: clear the Kimironko market drains',
      description:
        'The monthly community work. We clear the drains along the market road before ' +
        'the rains, then stay for the sector meeting.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Kimironko market road',
      sector: 'Kimironko',
      maxCapacity: 30,
      applicationDeadline: new Date(umuganda.getTime() - 2 * DAY),
      startsAt: umuganda,
      endsAt: umugandaEnd,
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: ['Construction and manual work', 'Gardening and planting'],
      categories: ['Climate and environment', 'Community infrastructure'],
      applications: {
        create: [
          applied(keza.id, ApplicationStatus.ACCEPTED, 20, 'It is my own street, so I will be there anyway.'),
          applied(shema.id, ApplicationStatus.ACCEPTED, 20, 'I can photograph it for the sector page.'),
          applied(aline.id, ApplicationStatus.ACCEPTED, 20, 'Count me in.'),
          applied(patrick.id, ApplicationStatus.ACCEPTED, 19, 'I will bring a wheelbarrow.'),
          applied(divine.id, ApplicationStatus.ACCEPTED, 19, 'I can bring the first aid kit.'),
          applied(ineza.id, ApplicationStatus.REJECTED, 19, 'I can only make the afternoon.'),
        ],
      },
      checkins: {
        create: [
          {
            volunteerId: keza.id,
            method: CheckInMethod.QR,
            checkinTime: new Date(umuganda.getTime() - 6 * 60 * 1000),
            checkoutTime: new Date(umugandaEnd.getTime() + 7 * 60 * 1000),
          },
          {
            volunteerId: shema.id,
            method: CheckInMethod.MANUAL,
            checkinTime: new Date(umuganda.getTime() + 11 * 60 * 1000),
            checkoutTime: new Date(umugandaEnd.getTime() - 15 * 60 * 1000),
          },
          {
            volunteerId: aline.id,
            method: CheckInMethod.QR,
            checkinTime: new Date(umuganda.getTime() + 2 * 60 * 1000),
            checkoutTime: new Date(umugandaEnd.getTime() - 4 * 60 * 1000),
          },
          {
            volunteerId: patrick.id,
            method: CheckInMethod.QR,
            checkinTime: new Date(umuganda.getTime() + 18 * 60 * 1000),
            checkoutTime: new Date(umugandaEnd.getTime() + 2 * 60 * 1000),
          },
          {
            volunteerId: divine.id,
            method: CheckInMethod.MANUAL,
            checkinTime: new Date(umuganda.getTime() - 3 * 60 * 1000),
            checkoutTime: new Date(umugandaEnd.getTime() - 31 * 60 * 1000),
          },
        ],
      },
      portfolioEntries: {
        create: [
          {
            volunteerId: keza.id,
            hoursCredited: 3.22,
            skillsCredited: ['Construction and manual work', 'Gardening and planting'],
            dateCredited: umugandaEnd,
          },
          {
            volunteerId: shema.id,
            hoursCredited: 2.57,
            skillsCredited: ['Construction and manual work', 'Gardening and planting'],
            dateCredited: umugandaEnd,
          },
          {
            volunteerId: aline.id,
            hoursCredited: 2.9,
            skillsCredited: ['Construction and manual work', 'Gardening and planting'],
            dateCredited: umugandaEnd,
          },
          {
            volunteerId: patrick.id,
            hoursCredited: 2.73,
            skillsCredited: ['Construction and manual work', 'Gardening and planting'],
            dateCredited: umugandaEnd,
          },
          {
            volunteerId: divine.id,
            hoursCredited: 2.53,
            skillsCredited: ['Construction and manual work', 'Gardening and planting'],
            dateCredited: umugandaEnd,
          },
        ],
      },
    },
  })

  // Section A7 again. Keza organised this, so her portfolio counts it separately
  // from her hours. Published and already finished, which is what makes it count.
  await prisma.opportunity.create({
    data: {
      creatorId: keza.id,
      title: 'Kimironko library book drive',
      description:
        'Neighbours brought books they had finished with and we sorted them for the ' +
        'library. Three hundred and forty books in one afternoon.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Kimironko public library',
      sector: 'Kimironko',
      maxCapacity: 15,
      applicationDeadline: at(-18, 18),
      startsAt: at(-14, 14),
      endsAt: at(-14, 17),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: ['Event planning', 'Construction and manual work'],
      categories: ['Education', 'Community infrastructure'],
      applications: {
        create: [
          applied(shema.id, ApplicationStatus.ACCEPTED, 20, 'I can carry boxes.'),
          applied(ineza.id, ApplicationStatus.ACCEPTED, 19, 'Count me in.'),
        ],
      },
      portfolioEntries: {
        create: [
          {
            volunteerId: shema.id,
            hoursCredited: 3,
            skillsCredited: ['Construction and manual work'],
            dateCredited: at(-14, 17),
          },
          {
            volunteerId: ineza.id,
            hoursCredited: 2.75,
            skillsCredited: ['Construction and manual work'],
            dateCredited: at(-14, 17),
          },
        ],
      },
    },
  })

  await prisma.notification.create({
    data: {
      userId: keza.id,
      type: 'APPLICATION_DECIDED',
      message: 'Isoko Youth Network accepted your application for Health campaign content for social media.',
      isRead: false,
      createdAt: at(-5, 9),
    },
  })

  const until = fromNow(4).toLocaleTimeString('en-GB', {
    timeZone: 'Africa/Kigali',
    hour: '2-digit',
    minute: '2-digit',
  })

  console.log('Video seed ready. Password for all eight:', PASSWORD)
  console.log('')
  console.log(`  ${cast.keza.email}       volunteer, left window`)
  console.log(`  ${cast.organisation.email}      organisation, right window`)
  console.log(`  ${cast.admin.email}    community admin, third tab`)
  console.log(`  ${cast.shema.email}      checks in during the tutoring session`)
  console.log(`  ${cast.ineza.email}      proposed the football coaching`)
  console.log('  aline, patrick, divine        background, for the registers and lists')
  console.log('')
  console.log("Keza's feed ranks 83, 78, 28, 16, 13 per cent,")
  console.log('and the football initiative joins at 44 once the admin approves it.')
  console.log('')
  console.log('Waiting for the organisation:')
  console.log('  2 applications on the reading club, so Keza tops it when she applies')
  console.log('  2 on the health campaign, 1 on the bookkeeping clinic')
  console.log('  1 on the tree planting that cannot be accepted, its only place is taken')
  console.log('  1 deliverable to review, with an approved and a rejected one beside it')
  console.log('')
  console.log('Tutoring is open for check-in until', until, 'Kigali time.')
  console.log('Pending for the admin: Saturday football coaching for girls.')
  console.log('')
  console.log('Re-run this between takes. It deletes these eight accounts first.')
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())