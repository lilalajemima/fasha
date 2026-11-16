# Fasha API

The server behind Fasha. It holds the accounts, the opportunities, the applications, the
attendance registers and the portfolios, and it decides who is allowed to do what.

Express 5 and TypeScript, talking to PostgreSQL through Prisma. The database is on Supabase and
the API is deployed on Vercel.

## What it does

- accounts and sign in, with an email and password or a Google account, and JSON web tokens
- opportunities: create, edit, close, delete, approve
- applications, with a match score between the volunteer and the work
- attendance, using a code that changes every thirty seconds
- work sent in for remote opportunities, approved or rejected with a reason
- portfolios, including a public page anybody can open
- notifications
- oversight for the community admin, including CSV exports

## Prerequisites

- node 20 or newer
- a PostgreSQL database

## Installation

```bash
npm install
cp .env.example .env        # then fill it in
npm run db:migrate
npm run db:seed             # optional
npm run dev                 # http://localhost:4000
```

`GET /health` is the quickest way to tell whether it is working. It runs `SELECT 1`, so an `ok`
back means the server started and the database answered.

## Environment variables

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | The pooled Supabase connection, used at runtime |
| `DIRECT_URL` | The direct connection, used by migrations. Prisma cannot migrate through the pooler |
| `JWT_SECRET` | Signs the tokens. Any long random string |
| `JWT_EXPIRES_IN` | How long a sign in lasts. Defaults to 7 days |
| `PORT` | Defaults to 4000 |
| `CLIENT_ORIGIN` | The one origin CORS accepts |
| `GOOGLE_CLIENT_ID` | The OAuth client id from Google Cloud. Without it, signing in with Google says it is not set up |
| `TEST_DATABASE_URL` | Only for `npm run test:db`. Has to be a database on this computer |
| `API_URL` | Only for `npm run smoke`. Where the API is. Defaults to `http://localhost:4000` |
| `SMOKE_ADMIN_EMAIL`, `SMOKE_ADMIN_PASSWORD` | Only for `npm run smoke`. Without them the admin steps are skipped |

`CLIENT_ORIGIN` is the one that catches people out. If the frontend loads but every request fails,
it is almost always because this does not match where the page is being served from.

The `SEED_*` variables are only needed for `npm run db:seed`. It wants a name and an email for all
three roles, plus `SEED_PASSWORD` of at least 8 characters.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the API and restarts when a file changes |
| `npm test` | Runs the unit tests |
| `npm run test:db` | Runs the query tests against a throwaway local database. See below |
| `npm run typecheck` | Type checks without building |
| `npm run build` | Compiles to `dist`. This is what Vercel runs, so run it before pushing |
| `npm run db:migrate` | Creates a migration from a schema change and applies it |
| `npm run db:deploy` | Applies existing migrations. This is the production one |
| `npm run db:generate` | Rebuilds the Prisma client from the schema |
| `npm run db:seed` | Fills an empty database with demo accounts |
| `npm run db:seed:video` | Creates one organisation with a hundred invented published opportunities, plus the shared demo accounts. It deletes that organisation first, so never run it once real people are applying |
| `npm run db:studio` | Opens Prisma Studio to look at the data |
| `npm run db:cleanup` | Removes what the smoke test created (`@fasha.test` accounts) |
| `npm run smoke` | Walks a whole scenario through a running API |
| `npm run load` | Load tests the API. See below |

## Testing the queries

`npm test` checks the rules with fakes in place of the database, so it never runs a Prisma query.
The `*.db.test.ts` files do: the report filters, the feed search, the user search, the capacity
check when two organisers accept at once, and the Google id staying unique. They need a real
Postgres, and they empty every table before they start, so they refuse anything but a database
on this computer.

```bash
docker compose -f docker-compose.test.yml up -d
TEST_DATABASE_URL=postgresql://fasha:fasha@localhost:5433/fasha_test npm run test:db
docker compose -f docker-compose.test.yml down
```

There are 28 of these tests in 5 files.

`test:db` applies every migration to that database first, so it also shows that the migrations
still run in order from nothing. The container keeps its data in memory, and `down` throws it away.

## Architecture

```
src/
  core/          things that are not about any one feature
    config/      environment variables
    database/    the Prisma client and a base repository
    domain/      the catalogue of skills, interests and sectors
    errors/      the error types the handler understands
    http/        the error handler and route params
    security/    password hashing, tokens, the rotating check in codes
    validation/  readers that check what came in the request body
  middleware/    authenticate and authorise
  modules/       one folder per feature
  app.ts         builds the Express app
  server.ts      starts it
```

Nothing in `core` knows what an opportunity is. That is the test for whether something belongs
there.

### One folder per feature

`modules` holds accounts, admin, applications, auth, catalogue, checkin, health, matching,
notifications, opportunities, portfolio, profile and submissions. Each one has the same six files.
Taking submissions as the example:

| File | What it does |
| --- | --- |
| `submission.routes.ts` | Which URLs exist, builds the service, puts the guards on |
| `SubmissionController.ts` | Reads the request, calls the service, sends the response. No rules |
| `SubmissionService.ts` | The rules. Read this file first |
| `SubmissionStore.ts` | An interface saying what the service needs from the database |
| `SubmissionRepository.ts` | Does what the interface promises, using Prisma |
| `SubmissionView.ts` | Turns a database row into the shape the browser receives |

Splitting the store from the repository means the service never touches Prisma. It depends on an
interface, so a test hands it a small fake instead of a database. That is why the whole test suite
runs in about a second and needs nothing running.

The wiring happens in the routes file rather than in a framework. It is more typing than a
dependency injection container, but you can read it top to bottom and see what talks to what.

## I want to add a feature. What do I do?

Say the district asks for opportunities to be marked urgent.

**1. Decide where it goes.** A new noun with its own URLs is a new folder in `modules`, copied from
an existing one. A new thing an existing noun can do goes in that module.

**2. Change the database, if the data changes.**

```bash
npm run db:migrate -- --name opportunity_urgent
```

That writes a folder under `prisma/migrations` and applies it. Commit the folder. Production runs
`db:deploy`, which replays those folders and never invents one.

**3. Say what the service needs.** Add it to the store interface.

**4. Make it true.** Implement it in the repository, which is where Prisma lives.

**5. Write the rule and the test.** The rule goes in the service. Write the test first using a fake
store. Role checks belong here, not in the controller.

**6. Shape what goes out.** Add the field in the view file.

**7. Read what comes in.** In the controller, use the helpers in `core/validation/readers.ts`
rather than reading `req.body` by hand. They throw a clean 400 instead of letting a bad value
through.

**8. Add the URL** in the routes file, with `authenticate` and `authorise` as needed.

**9. If it is a new module**, add `app.use(yourRoutes)` in `src/app.ts`. `notFoundHandler` and
`errorHandler` stay last.

**10. Check it.**

```bash
npm test
npm run typecheck
npm run build
```

**11. Tell the frontend.** Add the field to `frontend/src/lib/types.ts`. Nothing enforces that the
two agree, so this step is easy to forget.

Quick rule: a rule goes in the service, a Prisma query goes in the repository, reading or writing
HTTP goes in the controller, and anything that would be the same in an app with nothing to do with
volunteering goes in `core`.

## Decisions worth knowing about

**Matching.** A volunteer's skills and interests are compared with what an opportunity asks for,
weighted 0.65 to skills and 0.35 to interests, using Jaccard similarity. Both sides pick from one
fixed catalogue in `core/domain/catalogue.ts` and the server refuses anything not on it. Before
that list existed, "Graphic design", "graphics" and "designing posters" were three different tags
and the score meant nothing.

**Check in.** Attendance uses a rotating code. The organiser's screen shows a QR code that changes
every thirty seconds, built with HOTP in `core/security/TotpService.ts` on Node's own `crypto`
module rather than a third-party library, and the server accepts the current code or one step
either side to allow for clocks that disagree. A fixed code could be
photographed once and sent to people who never turned up.

**Hours.** A volunteer cannot give themselves hours. They are credited by an organiser closing a
register or accepting work that was sent in. An initiative somebody ran themselves counts as
organised on their portfolio, not as verified time.

**Deleting an account.** Deleting does not remove the row. Other people's registers, the hours an
organiser verified and the applications made to an initiative all point at the account. What goes
is the identity: the name, the email, the password hash, the Google link, the profile's skills,
interests, availability and sector, and the portfolio link. It happens in one transaction, so a
half-deleted person is never left behind, and the password is asked for again first because it
cannot be undone.

**Signing in with Google.** The browser gets a signed token from Google and sends it to
`POST /auth/google`, which checks it against `GOOGLE_CLIENT_ID`. Fasha keeps the Google account id,
the name and the email, and never sees the Google password.

**Deactivation takes effect immediately.** The `authenticate` middleware reads the account on every
request instead of trusting the seven day token.

**Changing a password ends the other sessions.** Every account has a `tokenVersion` that goes up
whenever a password is set, and `authenticate` compares it with the version inside the token. Every
route that sets a password goes through the same `setPassword`, so an admin's reset revokes tokens
as well. The device that made the change is handed a replacement token in the reply.

**Briefs.** The optional PDF on an opportunity lives in its own table. A megabyte of base64 on the
opportunity row would be read by every query that lists opportunities and never needs it.

## Database schema

Ten tables, defined in `prisma/schema.prisma`.

| Table | What it holds |
| --- | --- |
| `users` | Every account. Name, email, password hash, role, status, avatar, token version |
| `volunteer_profiles` | Skills, interests, availability slots, location, sector, portfolio slug |
| `opportunities` | Title, description, mode, location, capacity, dates, status, required skills |
| `opportunity_briefs` | The optional PDF, kept separate from the opportunity row |
| `applications` | Who applied to what, their statement, and the decision |
| `checkins` | Check in and check out times, and whether it was a QR scan or manual |
| `task_submissions` | Hours claimed, a link to the proof, the decision and the reason |
| `portfolio_entries` | Hours credited and the skills they count towards |
| `collaborators` | Co-organisers on an opportunity . . In the schema for a later feature, not used yet |
| `notifications` | What a person has been told, and whether they have read it |

A deleted account keeps its row, so every one of these stays intact when somebody leaves.

## API

Everything needs a bearer token except the routes marked public.

### Auth and accounts
```
POST   /auth/register                     public
POST   /auth/login                        public
POST   /auth/google                       public
GET    /auth/me
POST   /account/password
POST   /account/forgotten                 public
PATCH  /account/deactivate
POST   /account/delete
```

### Opportunities
```
GET    /opportunities                     the feed, with match scores
GET    /opportunities/mine
GET    /opportunities/mine/workload
GET    /opportunities/pending             admin
GET    /opportunities/all                 admin, the last twelve months
GET    /opportunities/:id
GET    /opportunities/:id/brief           public
POST   /opportunities
PATCH  /opportunities/:id
PATCH  /opportunities/:id/close
PATCH  /opportunities/:id/status          admin, approve or reject
DELETE /opportunities/:id
```

### Applications
```
GET    /applications/mine
GET    /opportunities/:id/applications
POST   /opportunities/:id/applications
PATCH  /applications/:id/status
PATCH  /applications/:id/withdraw
```

### Attendance
```
POST   /opportunities/:id/checkin-code
POST   /opportunities/:id/checkins
POST   /opportunities/:id/checkins/manual
GET    /opportunities/:id/checkins
GET    /opportunities/:id/attendance.csv
GET    /checkins/mine
PATCH  /checkins/:id/checkout
```

### Submissions
```
GET    /submissions/mine
GET    /submissions/received
GET    /opportunities/:id/submissions
POST   /opportunities/:id/submissions
PATCH  /submissions/:id/status
```

### Profile, portfolio, catalogue
```
PATCH  /profile
GET    /portfolio/mine
GET    /p/:slug                           public
GET    /catalogue                         public
```

### Oversight
```
GET    /admin/summary
GET    /admin/activity
GET    /admin/report.csv
GET    /admin/users
PATCH  /admin/users/:id/status
POST   /admin/users/:id/password-reset
DELETE /admin/users/:id
```

### Other
```
GET    /health                            public
GET    /notifications
PATCH  /notifications/:id/read
PATCH  /notifications/read-all
```

## Testing

`npm test` runs 269 unit tests in 21 files with Vitest, in a few seconds. They cover the services,
where the rules are, using in-memory fakes rather than a database.

`npm run test:db` runs the 28 query tests described above against a throwaway Postgres.

`npm run typecheck` leaves out the test files, so a test can be broken while it passes. `npm test`
is the one that catches that.

`npm run smoke` runs against a live API and walks through a whole scenario in 89 checks: signing
people up, applying, approving, checking in and reading the portfolio. It creates real rows, so
`npm run db:cleanup` removes what it made.

`npm run load` measures three endpoints at 10, 25 and 50 concurrent users. The three are chosen so
the gaps mean something: `/catalogue` touches no database, `/health` is one `SELECT 1`, and
`/opportunities` is a real query. It refuses to run against anything but localhost unless you pass
`--force`. Results are written to `load-results/`, which is not committed. It signs up one
`load-...@example.invalid` account in whatever database the API is using, which `db:cleanup` does
not remove.

## Deployment

Vercel runs the API as a serverless function. `api/index.ts` exports the Express app, `vercel.json`
rewrites every path to it, and the empty `public` folder exists only because Vercel wants an output
directory. Do not delete it.

`docker compose up` from the repository root runs the API on 4000 and the frontend on 8081. The
container applies migrations before it starts. If you move either port, move both: the browser is
told where the API is when the frontend image is built, and the API only accepts the origin in
`CLIENT_ORIGIN`.

## Licences

Every dependency keeps its own licence: MIT for Express, cors, pg, bcrypt, jsonwebtoken and
qrcode, Apache-2.0 for Prisma and its Postgres adapter, and BSD-2-Clause for dotenv. The
development tools (TypeScript, Vitest, ts-node-dev) are MIT or Apache-2.0. None of them is GPL.
Signing in with Google follows the Google APIs Terms of Service. The skills and interests
catalogue and the seed data are written for Fasha.

## Known limitations

- the database is hosted in Frankfurt. Rwanda's data protection law (Law N° 058/2021, Article 50)
  only allows personal data to be stored outside Rwanda with a certificate from the supervisory
  authority, which this pilot does not have. wider use needs that certificate or a host in Rwanda

- no email. a forgotten password is handled by a community admin issuing a temporary one in
  person. honest for a pilot in one sector, does not scale past it
- profile pictures and briefs are base64 in Postgres, limited to about 150KB and 1MB. at a few
  hundred accounts they should move to Supabase Storage
- `GET /opportunities/all` returns full records for twelve months. fine at a few hundred rows
- `tsconfig.json` excludes `*.test.ts`, so nothing in the pipeline type checks the tests
- no rate limiting on sign in or the forgotten password endpoint

## Common issues

**Issue: TypeScript says a field does not exist on a model that is in `schema.prisma`**

- the generated client is behind: `npm run db:generate`
- if that does not fix it, there is a leftover `node_modules/.prisma` from an older Prisma version
  being picked up first. `rm -rf node_modules/.prisma` then generate again
- `prisma migrate dev` skips generating when there is nothing to apply, so a migration that ran
  earlier can leave the client stale with no sign anything is wrong

**Issue: `prisma migrate dev` says "already in sync" but the column is missing**

- the schema file on disk does not have the change. check with `grep` before running it again

**Issue: `npm run dev` exits straight away**

- something else has port 4000, usually a Docker container. `docker compose down`

**Issue: `npm run db:seed` fails on a missing variable**

- it needs a name and email for all three roles plus `SEED_PASSWORD`. check `.env.example` has all
  of them listed