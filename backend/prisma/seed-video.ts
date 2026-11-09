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
 * One hundred published opportunities under a single organisation account,
 * so a visitor arriving at an empty platform sees a feed worth ranking.
 *
 * Every tag is from core/domain/catalogue.ts and every sector from
 * core/domain/sectors.ts, so nothing here can be refused by the server.
 *
 * Run it once before the pilot opens. It deletes the Fasha Org account first,
 * which cascades to these opportunities and to any applications made against
 * them, so do not run it again once real people have started applying.
 */

const ORG_NAME = 'Fasha Org'
const ORG_EMAIL = 'fashaorg@fasha.rw'
const ORG_PASSWORD = 'fasha2026'

// Shared accounts for anyone who would rather not sign up with their own details.
const DEMO_PASSWORD = 'fasha2026'
const DEMO_VOLUNTEER = 'volunteer@fasha.demo'
const DEMO_ORGANISATION = 'organisation@fasha.demo'

const DAY = 24 * 60 * 60 * 1000
const KIGALI = 2

// Short names for the catalogue strings, so the listings below stay readable.
const WEB = 'Web development'
const MOB = 'Mobile app development'
const GFX = 'Graphic design'
const PHO = 'Photography'
const VID = 'Videography'
const EDT = 'Video and image editing'
const SOC = 'Social media and communications'
const WRI = 'Writing and translation'
const TEA = 'Teaching and tutoring'
const SPK = 'Public speaking and facilitation'
const EVT = 'Event planning'
const FUN = 'Fundraising and grant writing'
const DAT = 'Data entry and analysis'
const AID = 'First aid'
const CON = 'Construction and manual work'
const GAR = 'Gardening and planting'
const COO = 'Cooking and catering'
const ACC = 'Accounting and bookkeeping'
const PRJ = 'Project management'
const DRV = 'Driving and logistics'

const HEA = 'Healthcare'
const ENV = 'Climate and environment'
const EDU = 'Education'
const ART = 'Arts and culture'
const ENP = 'Entrepreneurship'
const WOM = "Women's empowerment"
const YOU = 'Youth and children'
const SPO = 'Sports and recreation'
const TEC = 'Technology and digital skills'
const INF = 'Community infrastructure'
const FOO = 'Food security and agriculture'
const DIS = 'Disability inclusion'

// Applicants, so the demo organisation has a queue worth reviewing.
const FILLERS = [
  { name: 'Clarisse Mukeshimana', email: 'clarisse@fasha.demo',
    skills: [TEA, WRI], interests: [EDU, WOM] },
  { name: 'Eric Habimana', email: 'eric@fasha.demo',
    skills: [SOC, VID], interests: [TEC, YOU] },
  { name: 'Sandrine Ingabire', email: 'sandrine@fasha.demo',
    skills: [AID, SPK], interests: [HEA, YOU] },
  { name: 'Olivier Niyonzima', email: 'olivier@fasha.demo',
    skills: [PHO, GFX, SOC], interests: [ART, YOU] },
  { name: 'Josiane Uwase', email: 'josiane@fasha.demo',
    skills: [GAR, EVT], interests: [ENV, INF] },
]

const P = OpportunityMode.PHYSICAL
const V = OpportunityMode.VIRTUAL

type Listing = {
  title: string
  description: string
  skills: string[]
  categories: string[]
  mode: OpportunityMode
}

const L = (
  title: string,
  description: string,
  skills: string[],
  categories: string[],
  mode: OpportunityMode = P,
): Listing => ({ title, description, skills, categories, mode })

const LISTINGS: Listing[] = [
  /* ---------------- Education ---------------- */
  L('After-school reading club', 'Read with two P4 pupils for an hour and a half, twice a week. The school provides the term reader. Most of the work is listening.', [TEA, SPK], [EDU, YOU]),
  L('Senior 6 exam revision, maths and physics', 'Work through past papers with a group of four. We supply the papers and the room.', [TEA], [EDU, YOU]),
  L('Homework support at the community library', 'Sit with whoever turns up after school and help with what they have been set.', [TEA], [EDU, YOU]),
  L('English conversation practice for S3 students', 'Forty minutes of spoken English, in pairs. No lesson planning, just conversation.', [TEA, SPK], [EDU]),
  L('Build a reading corner at the nursery', 'Shelves, cushions and a coat of paint in one unused classroom.', [CON], [EDU, INF]),
  L('Record audio lessons in Kinyarwanda', 'Read six short science lessons aloud for pupils who learn better by listening.', [WRI, SPK], [EDU, TEC], V),
  L('Translate study notes into Kinyarwanda', 'Three chapters of S2 biology notes, currently English only.', [WRI], [EDU], V),
  L('Mark practice papers remotely', 'Thirty scripts, with a marking scheme provided. Comments more useful than scores.', [TEA, DAT], [EDU], V),
  L('Library cataloguing afternoon', 'Sort and shelve a donation of around four hundred books.', [DAT], [EDU, INF]),

  /* ---------------- Healthcare ---------------- */
  L('Health centre queue support', 'Help people find the right desk and fill in forms. Nothing clinical.', [SPK, WRI], [HEA]),
  L('Malaria prevention door to door', 'Walk a route with a community health worker, explaining bed net use.', [SPK], [HEA, INF]),
  L('First aid cover at the sector sports day', 'Trained first aiders to staff a tent for the morning.', [AID], [HEA, SPO]),
  L('Blood donation drive, registration desk', 'Sign people in, record details and manage the waiting area.', [DAT, SPK], [HEA]),
  L('Design posters on hand hygiene', 'Six A3 posters for the health centre waiting room, Kinyarwanda and English.', [GFX], [HEA], V),
  L('Accompany elderly patients to appointments', 'Meet at home, travel together, wait, and see them back.', [DRV], [HEA, DIS]),
  L('Mental health awareness session for youth', 'Facilitate a ninety minute conversation using a provided guide.', [SPK], [HEA, YOU]),
  L('Write plain-language health leaflets', 'Turn four clinical fact sheets into something a reader can actually use.', [WRI], [HEA], V),

  /* ---------------- Climate and environment ---------------- */
  L('Umuganda: clear the market drains', 'The monthly community work, then the sector meeting afterwards.', [CON, GAR], [ENV, INF]),
  L('Tree planting along the school boundary', 'Plant and water forty seedlings. Tools provided.', [GAR], [ENV, EDU]),
  L('Wetland clean-up at Nyabugogo', 'Collect and sort waste along a marked stretch. Gloves and bags supplied.', [CON], [ENV]),
  L('Build compost bins for the community garden', 'Three bins from pallets, in one Saturday.', [CON, GAR], [ENV, FOO]),
  L('Run a plastic sorting workshop', 'Show households how to separate and store recyclables.', [SPK], [ENV, INF]),
  L('Photograph the river clean-up', 'Pictures for the sector report and the project page.', [PHO], [ENV, ART]),
  L('Seedling nursery maintenance', 'Watering, weeding and moving trays. Two mornings a week.', [GAR], [ENV, FOO]),
  L('Map illegal dumping sites', 'Walk assigned streets and record locations in a shared sheet.', [DAT], [ENV, TEC]),
  L('Write up the sector tree survival survey', 'Turn two years of planting records into a short report.', [DAT, WRI], [ENV], V),

  /* ---------------- Youth and children ---------------- */
  L('Saturday football coaching for girls', 'Run drills, keep score and walk the youngest ones home afterwards.', [EVT, SPK, TEA], [SPO, YOU]),
  L('Holiday art club', 'Three mornings of drawing and painting with P2 to P5.', [EVT], [ART, YOU]),
  L('Careers morning for S5 and S6', 'Talk about what you do and answer questions. Twenty minutes each.', [SPK], [EDU, YOU]),
  L('Chess club setup at the youth centre', 'Teach the rules and run a small ladder tournament.', [TEA, EVT], [SPO, YOU]),
  L('Mentor a school leaver through job applications', 'Four sessions: CV, applications, interviews, follow-up.', [WRI, SPK], [YOU, ENP]),
  L('Youth centre open day, logistics', 'Set up, direct arrivals, pack down, and post updates through the day.', [EVT, DRV, SOC], [YOU, INF]),
  L('Film a day in the life of the youth centre', 'Three minute piece for the sector page. Consent forms provided.', [VID, EDT], [YOU, ART]),
  L('Run a storytelling hour at the library', 'Read aloud to under-sevens and their carers.', [SPK], [YOU, ART]),

  /* ---------------- Technology and digital skills ---------------- */
  L('Smartphone basics for older residents', 'One to one: calls, messages, mobile money, staying safe.', [TEA, SPK], [TEC, DIS]),
  L('Teach spreadsheets to market traders', 'Two sessions on recording stock and takings.', [TEA, DAT], [TEC, ENP]),
  L('Build a one-page site for a cooperative', 'Simple, mobile-first, with their contact details and products.', [WEB, MOB], [TEC, ENP], V),
  L('Digitise the health centre paper records', 'Type patient visit logs into a provided template. Training given.', [DAT], [TEC, HEA]),
  L('Fix donated laptops for the school lab', 'Clean installs, basic repairs, label what cannot be saved.', [CON], [TEC, EDU]),
  L('Online safety workshop for parents', 'Ninety minutes on accounts, passwords and what children actually use.', [SPK, TEA], [TEC, YOU]),
  L('Test a government service portal and report problems', 'Try ten common tasks and write up where you got stuck.', [DAT, WRI], [TEC], V),
  L('Teach typing to S1 students', 'Weekly half hour sessions in the computer room.', [TEA], [TEC, EDU]),
  L('Set up a shared calendar for the sector office', 'Configure it, then show three staff how to use it.', [DAT, TEA], [TEC, INF]),

  /* ---------------- Community infrastructure ---------------- */
  L('Repair the footbridge handrail', 'Measure, cut and fit. Materials on site.', [CON], [INF]),
  L('Paint the sector office meeting room', 'Two coats, one day, brushes provided.', [CON], [INF]),
  L('Dig drainage channels before the rains', 'Hard work, early start, water provided.', [CON], [INF, ENV]),
  L('Install solar lights on the market path', 'Four fittings, under supervision of an electrician.', [CON], [INF, ENV]),
  L('Street name signage survey', 'Walk assigned roads and record missing or damaged signs.', [DAT], [INF]),
  L('Build benches for the health centre waiting area', 'Six benches from timber, in a weekend.', [CON], [INF, HEA]),
  L('Clear and level the community pitch', 'Remove stones, fill holes, mark the lines.', [CON, GAR], [INF, SPO]),
  L('Photograph completed sector projects', 'Before and after pictures for the annual report.', [PHO, EDT], [INF, ART]),

  /* ---------------- Food security and agriculture ---------------- */
  L('Kitchen garden training for households', 'Show families how to start a sack garden. Seeds provided.', [GAR, TEA], [FOO, ENV]),
  L('Harvest day at the cooperative plot', 'Pick, sort and weigh. Bring a hat.', [GAR], [FOO]),
  L('Cook and serve at the school feeding programme', 'Early start, two hundred portions, kitchen team of six.', [COO], [FOO, EDU]),
  L('Food parcel packing and delivery', 'Pack sixty parcels, then deliver on an assigned route.', [DRV, CON], [FOO, DIS]),
  L('Record keeping for the seed bank', 'Enter variety, quantity and source into a provided sheet.', [DAT], [FOO, TEC]),
  L('Nutrition demonstration at the health centre', 'Cook two low-cost balanced meals in front of a group.', [COO, SPK], [FOO, HEA]),
  L('Build a rainwater tank stand', 'Block and mortar base for a 5,000 litre tank.', [CON], [FOO, INF]),
  L('Write up the cooperative harvest figures', 'Three seasons of records into one summary table.', [DAT, ACC], [FOO, ENP], V),

  /* ---------------- Women's empowerment ---------------- */
  L('Bookkeeping clinic for market traders', 'Sit with traders and set up a simple cash book each.', [ACC, DAT, TEA], [ENP, WOM]),
  L('Tailoring cooperative, photograph the product line', 'Clean product shots for an online catalogue.', [PHO, EDT], [WOM, ENP]),
  L('Facilitate a savings group meeting', 'Keep the agenda moving and record the decisions.', [SPK, ACC], [WOM, ENP]),
  L('Write grant applications for a women-led cooperative', 'Two applications, templates and past submissions provided.', [FUN, WRI], [WOM, ENP], V),
  L('Childcare during the skills training sessions', 'Watch eight under-fives for three hours so their mothers can attend.', [EVT], [WOM, YOU]),
  L('Design a logo and price list', 'For a cooperative selling soap and candles.', [GFX], [WOM, ENP], V),
  L('Transport goods to the Saturday market', 'One van, two trips, early morning.', [DRV], [WOM, ENP]),
  L('Digital literacy for women traders', 'Mobile money, WhatsApp Business, and keeping a phone secure.', [TEA, SPK, SOC], [WOM, TEC]),

  /* ---------------- Entrepreneurship ---------------- */
  L('Business plan review clinic', 'Read five short plans in advance and give feedback in person.', [ACC, WRI], [ENP]),
  L('Pitch practice for young entrepreneurs', 'Listen to eight pitches and give honest, specific feedback.', [SPK], [ENP, YOU]),
  L('Set up mobile money for small traders', 'Registration, basic security, and what the fees actually are.', [TEA], [ENP, TEC]),
  L('Photograph products for ten small businesses', 'A shared half day, four shots each.', [PHO, EDT], [ENP, ART]),
  L('Write product descriptions for an online shop', 'Forty items, Kinyarwanda and English.', [WRI, SOC], [ENP], V),
  L('Cooperative accounts tidy-up', 'Reconcile a year of receipts against the cash book.', [ACC, DAT], [ENP], V),
  L('Run a market stall display workshop', 'Practical session on laying out goods so people stop.', [SPK, EVT], [ENP, WOM]),

  /* ---------------- Arts and culture ---------------- */
  L('Imigongo painting workshop for children', 'Materials provided. No experience needed, just patience.', [EVT, TEA], [ART, YOU]),
  L('Record the sector choir rehearsal', 'Audio and a few stills for their first release.', [VID, EDT], [ART]),
  L('Design the programme for the cultural evening', 'One A5 folded programme, print-ready.', [GFX], [ART]),
  L('Oral history interviews with elders', 'Record and transcribe three conversations. Consent forms provided.', [WRI, VID], [ART]),
  L('Mural on the youth centre wall', 'Design agreed in advance. Two days, paint supplied.', [GFX, CON], [ART, YOU]),
  L('Stage crew for the drama group', 'Set, lights and props for two performances.', [EVT, CON], [ART]),
  L('Subtitle a short documentary', 'Twelve minutes, Kinyarwanda to English.', [WRI, EDT], [ART, TEC], V),
  L('Photograph the traditional dance festival', 'Full day, images for the organisers and the press pack.', [PHO, EDT], [ART, SPO]),

  /* ---------------- Sports and recreation ---------------- */
  L('Referee the youth league on Saturdays', 'Two matches a morning. Kit provided.', [SPK], [SPO, YOU]),
  L('Basketball coaching at the secondary school', 'Twice weekly sessions with S1 to S3.', [TEA, SPK], [SPO, YOU]),
  L('Organise the sector fun run', 'Route, registration, marshals and water points.', [EVT, PRJ], [SPO, INF]),
  L('Timekeeping and results at the athletics meet', 'Record times and publish the results sheet.', [DAT], [SPO]),
  L('Repair and maintain sports equipment', 'Balls, nets, posts. One Saturday.', [CON], [SPO, INF]),
  L('Film highlights from the league final', 'Short highlights package for the youth centre page.', [VID, EDT], [SPO, ART]),
  L('Cycling club route marshal', 'Stand at a junction and keep riders safe. Four hours.', [AID], [SPO, HEA]),

  /* ---------------- Disability inclusion ---------------- */
  L('Accessibility audit of the sector office', 'Walk through with a checklist and photograph the barriers.', [DAT, PHO], [DIS, INF]),
  L('Sign language practice group', 'Weekly practice with deaf residents. Beginners welcome.', [SPK], [DIS]),
  L('Read aloud for blind residents', 'Letters, official forms and the newspaper. One hour a week.', [SPK, WRI], [DIS]),
  L('Build a wheelchair ramp at the health centre', 'Concrete ramp with handrails, to a provided design.', [CON], [DIS, INF]),
  L('Caption community videos for deaf viewers', 'Eight short videos, captions in Kinyarwanda.', [EDT, WRI], [DIS, ART], V),
  L('Transport support for the disability association', 'Collect members for the monthly meeting and take them home.', [DRV], [DIS]),
  L('Adapt training materials into large print', 'Reformat six handouts. Templates provided.', [GFX, WRI], [DIS, EDU], V),
  L('Companionship visits for isolated residents', 'An hour a week, conversation and a cup of tea.', [SPK], [DIS, HEA]),

  /* ---------------- three more, to round out the feed ---------------- */
  L('Fundraising letters for the school lab appeal', 'Six letters to local businesses, drafted from a brief.', [FUN, WRI], [EDU, ENP], V),
  L('Coordinate the Umuganda volunteer rota', 'Keep the sign-up sheet current and remind people the day before.', [PRJ, DAT], [INF, ENV], V),
  L('Weekend cookery class for teenagers', 'Four sessions on cheap, quick meals. Ingredients provided.', [COO, TEA], [FOO, YOU]),
]

/* ------------------------------------------------------------------ */

function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SECTOR_POOL = [
  'Kimironko', 'Kimironko', 'Kimironko', 'Bumbogo', 'Bumbogo',
  'Remera', 'Kacyiru', 'Gisozi', 'Kinyinya', 'Ndera', 'Rusororo', 'Gatsata',
]

const VENUES: Record<string, string[]> = {
  Kimironko: ['Kimironko public library', 'Kimironko market, office block', 'GS Kimironko', 'Kimironko sector pitch'],
  Bumbogo: ['EP Bumbogo', 'Bumbogo sector office', 'Bumbogo health post'],
  Remera: ['Remera youth centre', 'Remera sector office'],
  Kacyiru: ['Kacyiru health centre', 'Kacyiru sector office'],
  Gisozi: ['Gisozi community hall', 'Gisozi market'],
  Kinyinya: ['Kinyinya youth centre', 'Kinyinya primary school'],
  Ndera: ['Ndera community garden', 'Ndera sector office'],
  Rusororo: ['Rusororo cooperative plot', 'Rusororo sector office'],
  Gatsata: ['Gatsata market', 'Gatsata community hall'],
}

function kigali(dayOffset: number, hour: number): Date {
  const base = new Date(Date.now() + dayOffset * DAY)
  return new Date(Date.UTC(
    base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), hour - KIGALI, 0,
  ))
}

const slug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/**
 * The two shared accounts the survey points people at, with enough history
 * that every screen has something on it. A volunteer with an empty profile
 * scores zero against the whole feed, and an organiser with no applications
 * sees an empty workspace, so both would look broken rather than new.
 */
async function seedDemoAccounts(hash: (plain: string) => Promise<string>) {
  console.log('Seeding the two shared demo accounts.')

  const volunteer = await prisma.user.create({
    data: {
      name: 'Demo Volunteer',
      email: DEMO_VOLUNTEER,
      bio: 'A shared account for trying Fasha without signing up.',
      passwordHash: await hash(DEMO_PASSWORD),
      role: UserRole.VOLUNTEER,
      profile: {
        create: {
          skills: [TEA, SPK, SOC, GFX],
          interests: [EDU, YOU, ENV],
          availabilitySlots: ['MON_AFTERNOON', 'WED_AFTERNOON', 'SAT_MORNING', 'SAT_AFTERNOON'],
          location: 'Kimironko, Kigali',
          sector: 'Kimironko',
          portfolioSlug: 'demo-volunteer',
        },
      },
    },
  })

  const organisation = await prisma.user.create({
    data: {
      name: 'Demo Organisation',
      email: DEMO_ORGANISATION,
      bio: 'A shared account for trying the organiser side of Fasha.',
      passwordHash: await hash(DEMO_PASSWORD),
      role: UserRole.ORGANISATION,
    },
  })

  const fillers = []
  for (const f of FILLERS) {
    fillers.push(await prisma.user.create({
      data: {
        name: f.name,
        email: f.email,
        passwordHash: await hash(DEMO_PASSWORD),
        role: UserRole.VOLUNTEER,
        profile: {
          create: {
            skills: f.skills,
            interests: f.interests,
            availabilitySlots: ['SAT_MORNING', 'SUN_MORNING'],
            location: 'Kigali',
            sector: 'Kimironko',
            portfolioSlug: slug(f.name) + '-demo',
          },
        },
      },
    }))
  }

  const applied = (volunteerId: string, status: ApplicationStatus, statement: string) =>
    ({ volunteerId, status, motivationStatement: statement })

  /* --- the demo organiser's own opportunities, with queues to work through --- */

  await prisma.opportunity.create({
    data: {
      creatorId: organisation.id,
      title: 'Reading support at Kimironko primary',
      description: 'Read with two pupils for an hour, twice a week. The school provides the books.',
      mode: OpportunityMode.PHYSICAL,
      location: 'GS Kimironko, lower block',
      sector: 'Kimironko',
      maxCapacity: 10,
      applicationDeadline: kigali(9, 18),
      startsAt: kigali(12, 15),
      endsAt: kigali(12, 17),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: [TEA, SPK],
      categories: [EDU, YOU],
      applications: {
        create: [
          applied(fillers[0].id, ApplicationStatus.PENDING, 'I read with my nieces every week.'),
          applied(fillers[1].id, ApplicationStatus.PENDING, 'I could film a short piece about it too.'),
          applied(fillers[2].id, ApplicationStatus.PENDING, 'I am free on weekday afternoons.'),
        ],
      },
    },
  })

  await prisma.opportunity.create({
    data: {
      creatorId: organisation.id,
      title: 'Tree planting at the sector office',
      description: 'Plant and water thirty seedlings along the boundary. Tools provided.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Kimironko sector office',
      sector: 'Kimironko',
      maxCapacity: 15,
      applicationDeadline: kigali(5, 18),
      startsAt: kigali(8, 8),
      endsAt: kigali(8, 11),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: [GAR, CON],
      categories: [ENV, INF],
      applications: {
        create: [
          applied(fillers[4].id, ApplicationStatus.PENDING, 'I grew most of those seedlings.'),
          applied(fillers[3].id, ApplicationStatus.PENDING, 'I can photograph it as well.'),
          applied(fillers[0].id, ApplicationStatus.ACCEPTED, 'Count me in.'),
        ],
      },
    },
  })

  await prisma.opportunity.create({
    data: {
      creatorId: organisation.id,
      title: 'Posters for the health campaign',
      description: 'Six A3 posters on malaria prevention, Kinyarwanda and English. Brand colours supplied.',
      mode: OpportunityMode.VIRTUAL,
      location: null,
      sector: 'Kimironko',
      maxCapacity: 6,
      applicationDeadline: kigali(11, 18),
      startsAt: null,
      endsAt: kigali(18, 21),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: [GFX, SOC],
      categories: [HEA, YOU],
      applications: {
        create: [
          applied(volunteer.id, ApplicationStatus.ACCEPTED, 'I lay out the tutoring group posts.'),
          applied(fillers[3].id, ApplicationStatus.ACCEPTED, 'I can do the photography.'),
          applied(fillers[1].id, ApplicationStatus.PENDING, 'I can cut a short video alongside.'),
        ],
      },
      // Three to review: one waiting, one already approved, one already returned.
      taskSubmissions: {
        create: [
          {
            volunteerId: fillers[3].id,
            hoursClaimed: 4,
            proofUrl: 'https://example.com/fasha/poster-drafts.pdf',
            status: SubmissionStatus.PENDING,
            createdAt: kigali(-1, 20),
          },
          {
            volunteerId: volunteer.id,
            hoursClaimed: 6.5,
            proofUrl: 'https://example.com/fasha/posters-final.pdf',
            status: SubmissionStatus.APPROVED,
            createdAt: kigali(-4, 21),
          },
          {
            volunteerId: fillers[1].id,
            hoursClaimed: 14,
            proofUrl: 'https://example.com/fasha/video-cut.pdf',
            status: SubmissionStatus.REJECTED,
            reviewNote: 'Fourteen hours does not match what we agreed. Please resubmit with the time actually spent.',
            createdAt: kigali(-3, 20),
          },
        ],
      },
      portfolioEntries: {
        create: [
          {
            volunteerId: volunteer.id,
            hoursCredited: 6.5,
            skillsCredited: [GFX, SOC],
            dateCredited: kigali(-4, 21),
          },
        ],
      },
    },
  })

  /* --- a session running now, so check-in can be opened on camera or live --- */
  await prisma.opportunity.create({
    data: {
      creatorId: organisation.id,
      title: 'Exam revision tutoring, Senior 6',
      description: 'Work through past papers in maths and physics with a group of four.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Kimironko public library, upstairs room',
      sector: 'Kimironko',
      maxCapacity: 8,
      applicationDeadline: new Date(Date.now() + 3 * 60 * 60 * 1000),
      startsAt: new Date(Date.now() - 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: [TEA, SPK],
      categories: [EDU],
      applications: {
        create: [
          applied(volunteer.id, ApplicationStatus.ACCEPTED, 'I tutor Senior 6 on weekday afternoons.'),
          applied(fillers[0].id, ApplicationStatus.ACCEPTED, 'I can take the maths group.'),
          applied(fillers[2].id, ApplicationStatus.ACCEPTED, 'Happy to help with physics.'),
        ],
      },
    },
  })

  /* --- a finished event, so the register, the CSV and the portfolio have content --- */
  const past = kigali(-12, 8)
  const pastEnd = kigali(-12, 11)

  await prisma.opportunity.create({
    data: {
      creatorId: organisation.id,
      title: 'Umuganda: clear the market drains',
      description: 'The monthly community work, then the sector meeting afterwards.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Kimironko market road',
      sector: 'Kimironko',
      maxCapacity: 30,
      applicationDeadline: kigali(-15, 18),
      startsAt: past,
      endsAt: pastEnd,
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: [CON, GAR],
      categories: [ENV, INF],
      applications: {
        create: [
          applied(volunteer.id, ApplicationStatus.ACCEPTED, 'It is my own street.'),
          applied(fillers[4].id, ApplicationStatus.ACCEPTED, 'I will bring tools.'),
          applied(fillers[2].id, ApplicationStatus.ACCEPTED, 'I can bring the first aid kit.'),
        ],
      },
      checkins: {
        create: [
          { volunteerId: volunteer.id, method: CheckInMethod.QR,
            checkinTime: new Date(past.getTime() - 5 * 60 * 1000),
            checkoutTime: new Date(pastEnd.getTime() + 6 * 60 * 1000) },
          { volunteerId: fillers[4].id, method: CheckInMethod.MANUAL,
            checkinTime: new Date(past.getTime() + 12 * 60 * 1000),
            checkoutTime: new Date(pastEnd.getTime() - 14 * 60 * 1000) },
          { volunteerId: fillers[2].id, method: CheckInMethod.QR,
            checkinTime: new Date(past.getTime() + 3 * 60 * 1000),
            checkoutTime: new Date(pastEnd.getTime() - 2 * 60 * 1000) },
        ],
      },
      portfolioEntries: {
        create: [
          { volunteerId: volunteer.id, hoursCredited: 3.18,
            skillsCredited: [CON, GAR], dateCredited: pastEnd },
          { volunteerId: fillers[4].id, hoursCredited: 2.57,
            skillsCredited: [CON, GAR], dateCredited: pastEnd },
          { volunteerId: fillers[2].id, hoursCredited: 2.92,
            skillsCredited: [CON, GAR], dateCredited: pastEnd },
        ],
      },
    },
  })

  /* --- an initiative the demo volunteer proposed and ran, so the
         portfolio shows organised separately from hours --- */
  await prisma.opportunity.create({
    data: {
      creatorId: volunteer.id,
      title: 'Kimironko library book drive',
      description: 'Neighbours brought books they had finished with and we sorted them for the library.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Kimironko public library',
      sector: 'Kimironko',
      maxCapacity: 15,
      applicationDeadline: kigali(-20, 18),
      startsAt: kigali(-16, 14),
      endsAt: kigali(-16, 17),
      status: OpportunityStatus.PUBLISHED,
      requiredSkills: [EVT, CON],
      categories: [EDU, INF],
      applications: {
        create: [
          applied(fillers[3].id, ApplicationStatus.ACCEPTED, 'I can carry boxes.'),
          applied(fillers[0].id, ApplicationStatus.ACCEPTED, 'Count me in.'),
        ],
      },
      portfolioEntries: {
        create: [
          { volunteerId: fillers[3].id, hoursCredited: 3,
            skillsCredited: [CON], dateCredited: kigali(-16, 17) },
          { volunteerId: fillers[0].id, hoursCredited: 2.75,
            skillsCredited: [CON], dateCredited: kigali(-16, 17) },
        ],
      },
    },
  })

  /* --- one initiative waiting for the district, so the admin queue is not empty --- */
  await prisma.opportunity.create({
    data: {
      creatorId: fillers[4].id,
      title: 'Saturday football coaching for girls',
      description: 'Six Saturdays of coaching for girls aged 10 to 14 on the sector pitch.',
      mode: OpportunityMode.PHYSICAL,
      location: 'Kimironko sector pitch',
      sector: 'Kimironko',
      maxCapacity: 20,
      applicationDeadline: kigali(10, 18),
      startsAt: kigali(13, 9),
      endsAt: kigali(13, 12),
      status: OpportunityStatus.PENDING_APPROVAL,
      requiredSkills: [EVT, SPK, TEA],
      categories: [SPO, YOU],
    },
  })

  await prisma.notification.createMany({
    data: [
      { userId: volunteer.id, type: 'APPLICATION_DECIDED',
        message: 'You have a place on "Posters for the health campaign".',
        isRead: false, createdAt: kigali(-5, 9) },
      { userId: volunteer.id, type: 'HOURS_DECIDED',
        message: 'Your 6.5 hours on "Posters for the health campaign" were approved.',
        isRead: false, createdAt: kigali(-4, 21) },
      { userId: organisation.id, type: 'APPLICATION_RECEIVED',
        message: 'Eric Habimana applied to "Reading support at Kimironko primary".',
        isRead: false, createdAt: kigali(-1, 8) },
    ],
  })
}

async function main() {
  console.log(`Seeding ${LISTINGS.length} opportunities under "${ORG_NAME}".`)

  const everyone = [ORG_EMAIL, DEMO_VOLUNTEER, DEMO_ORGANISATION,
    ...FILLERS.map(f => f.email)]
  await prisma.user.deleteMany({ where: { email: { in: everyone } } })

  const hasher = new PasswordHasher()
  const hash = (plain: string) => hasher.hash(plain)

  const org = await prisma.user.create({
    data: {
      name: ORG_NAME,
      email: ORG_EMAIL,
      bio: 'Sample opportunities published for the Fasha pilot study.',
      passwordHash: await hash(ORG_PASSWORD),
      role: UserRole.ORGANISATION,
    },
  })

  const rand = mulberry32(20261109)
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]

  let made = 0

  for (const listing of LISTINGS) {
    const sector = pick(SECTOR_POOL)
    // spread across the next ten weeks, two to four listings a day
    const startDay = 3 + Math.floor(rand() * 67)
    const startHour = [8, 9, 10, 14, 15, 16][Math.floor(rand() * 6)]
    const hours = 2 + Math.floor(rand() * 4)
    const physical = listing.mode === OpportunityMode.PHYSICAL

    await prisma.opportunity.create({
      data: {
        creatorId: org.id,
        title: listing.title,
        description: listing.description,
        mode: listing.mode,
        location: physical ? pick(VENUES[sector] ?? [`${sector} sector office`]) : null,
        sector,
        maxCapacity: [5, 6, 8, 10, 12, 15, 20, 25, 30, 40][Math.floor(rand() * 10)],
        applicationDeadline: kigali(Math.max(1, startDay - 2), 18),
        startsAt: physical ? kigali(startDay, startHour) : null,
        endsAt: physical ? kigali(startDay, startHour + hours) : kigali(startDay + 7, 21),
        status: OpportunityStatus.PUBLISHED,
        requiredSkills: listing.skills,
        categories: listing.categories,
      },
    })

    made += 1
    if (made % 25 === 0) console.log(`  ${made}`)
  }

  await seedDemoAccounts(hash)

  console.log('')
  console.log(`Done. ${made} public opportunities published.`)
  console.log('')
  console.log('Sign in as:')
  console.log(`  ${ORG_EMAIL}  /  ${ORG_PASSWORD}      owns the ${made} listings`)
  console.log(`  ${DEMO_VOLUNTEER}  /  ${DEMO_PASSWORD}      shared demo volunteer`)
  console.log(`  ${DEMO_ORGANISATION}  /  ${DEMO_PASSWORD}  shared demo organiser`)
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())