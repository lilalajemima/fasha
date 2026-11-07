# Fasha API

This is the server behind Fasha. It holds the accounts, the opportunities, the applications, the
attendance registers and the portfolios, and it decides who is allowed to do what.

It is an Express 5 application written in TypeScript, talking to a PostgreSQL database through
Prisma. The database is hosted on Supabase and the API is deployed on Vercel.

## Running it

You need Node 20 or newer and a PostgreSQL database. Copy `.env.example` to `.env` and fill it in,
then:

```bash
npm install
npm run db:migrate      # creates the tables
npm run db:seed         # optional: demo accounts and a few opportunities
npm run dev             # http://localhost:4000
```

`GET /health` is the quickest way to tell whether it is really working. It runs `SELECT 1` against
the database, so an `ok` back means the server started and the database answered.

### What goes in `.env`

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | The pooled Supabase connection, used by the app at runtime |
| `DIRECT_URL` | The direct connection, used by migrations. Prisma cannot migrate through the pooler |
| `JWT_SECRET` | Signs the tokens. Any long random string |
| `JWT_EXPIRES_IN` | How long a sign in lasts. Defaults to 7 days |
| `PORT` | Defaults to 4000 |
| `CLIENT_ORIGIN` | The one origin CORS accepts. `http://localhost:5173` for the dev server, `http://localhost:8081` for Docker, the Vercel URL in production |

`CLIENT_ORIGIN` is the setting that catches people out. If the frontend loads but every request
fails, this is almost always why: the browser is calling from an origin the API was not told about.

The `SEED_*` variables are only needed if you run `npm run db:seed`. It wants a name and an email
for each of the three roles, plus `SEED_PASSWORD` of at least 8 characters, and it stops with a
clear error if any of them is missing.

## The scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the API and restarts when a file changes |
| `npm test` | Runs the unit tests |
| `npm run typecheck` | Type checks without building |
| `npm run build` | Compiles to `dist`. This is what Vercel runs, so run it before pushing |
| `npm run db:migrate` | Creates a migration from a schema change and applies it locally |
| `npm run db:deploy` | Applies existing migrations without creating one. This is the production command |
| `npm run db:seed` | Fills an empty database with demo accounts and opportunities |
| `npm run db:cleanup` | Removes what the smoke test created |
| `npm run db:generate` | Rebuilds the Prisma client from the schema. `db:migrate` does this too |
| `npm run smoke` | Runs the end to end suite against a running API |

`npm run typecheck` leaves out the test files, so a test can be broken while it passes. `npm test`
is the one that catches that.

### When the types do not match the schema

If the compiler says a field does not exist on a model you can see in `schema.prisma`, the
generated client is behind. `npm run db:generate` usually fixes it.

If it does not, look at where the error says the types came from. Prisma 7 generates into
`node_modules/@prisma/client`, but older versions wrote to `node_modules/.prisma/client`, and a
leftover folder there gets picked up first and quietly wins. `npm install` does not clear it:

```bash
rm -rf node_modules/.prisma
npm run db:generate
```

`prisma migrate dev` skips generating when it finds nothing to apply, so a migration that ran
earlier can leave the client stale with no sign that anything is wrong.

## How the code is arranged

Everything is under `src`. Two folders matter.

`core` holds the things that are not about any one feature: the database client, the password
hasher, the token service, the rotating check in codes, the error types, the request readers and
the shared vocabulary of skills, interests and sectors. Nothing in `core` knows what an opportunity
is, which is the test for whether something belongs there.

`modules` holds one folder per feature: accounts, admin, applications, attendance, auth, catalogue,
checkin, matching, notifications, opportunities, portfolio, profile, submissions. Each folder has
the same six files, and the names say what each one is for.

Take `modules/submissions` as the example, because every other module copies it:

| File | What it does |
| --- | --- |
| `submission.routes.ts` | Says which URLs exist, builds the service, and puts the guards on |
| `SubmissionController.ts` | Reads the request, calls the service, sends the response. No rules here |
| `SubmissionService.ts` | The rules. Can this person send work in? Was it accepted? Is the deadline past? Read this file first |
| `SubmissionStore.ts` | An interface saying what the service needs from the database: find this, create that, count the other |
| `SubmissionRepository.ts` | Does what the interface promises, using Prisma |
| `SubmissionView.ts` | Turns a database row into the shape the browser receives |

The reason the store is split from the repository is that the service never touches Prisma. It
depends on an interface, so a test can hand it a small fake object instead of a database. That is
why the whole test suite runs in about a second and needs nothing running.

The wiring is done in the routes file rather than in a framework. `submission.routes.ts` builds the
repositories, passes them into the service, passes the service into the controller, and hangs the
controller's methods off the URLs. It is more typing than a dependency injection container, but you
can read it top to bottom and see exactly what talks to what.

## I want to add a feature. What do I do?

Say the district asks for opportunities to be marked urgent, so they sort to the top of Discover.

**1. Decide where it goes.** If it is a new noun with its own URLs, make a new folder in `modules`
and copy the six files from an existing one. If it is a new thing an existing noun can do, it goes
in that module. Urgent belongs to opportunities, so nothing new is created.

**2. Change the database, if the data changes.** Edit `prisma/schema.prisma`, then:

```bash
npm run db:migrate -- --name opportunity_urgent
```

That writes a folder under `prisma/migrations` and applies it. Commit the folder. Production runs
`db:deploy`, which replays those folders and never invents one, so a migration that is not
committed does not exist.

**3. Say what the service needs.** Add it to the store interface, in plain terms:

```ts
// in OpportunityStore.ts
urgent?: boolean
```

**4. Make it true.** Implement it in `OpportunityRepository.ts`, which is where Prisma lives.

**5. Write the rule, and the test.** The rule goes in `OpportunityService.ts`. Write the test first
in `OpportunityService.test.ts` using a fake store, because the fakes make it quick and because a
rule you cannot describe in a test is usually a rule you have not finished thinking about. Only an
organiser or an admin should be able to mark something urgent, so that check belongs here, not in
the controller.

**6. Shape what goes out.** Add the field in `OpportunityView.ts`, so the browser gets a flat object
rather than a database row.

**7. Read what comes in.** In `OpportunityController.ts`, use the helpers in
`core/validation/readers.ts` rather than reading `req.body` by hand. They throw a clean 400 with a
message instead of letting a bad value reach the service.

**8. Add the URL.** In `opportunity.routes.ts`, with `authenticate` for anything that needs a signed
in user and `authorise('ORGANISATION', 'ADMIN')` for anything role specific.

**9. If it is a new module**, add one line to `src/app.ts`:

```ts
app.use(urgentRoutes)
```

Order matters there: `notFoundHandler` and `errorHandler` stay last.

**10. Check it.**

```bash
npm test
npm run typecheck
npm run build
```

`build` is the one that matters before pushing, because it is the same compile Vercel runs and it
fails on things the dev server ignores, such as an import nothing uses.

**11. Tell the frontend.** Add the field to `frontend/src/lib/types.ts`. Nothing enforces that the
two agree, so this step is easy to forget and shows up as `undefined` in the browser.

A quick way to check where something belongs: if it is a rule, it goes in the service. If it is a
Prisma query, it goes in the repository. If it is reading or writing HTTP, it goes in the
controller. If it would be the same in an app that had nothing to do with volunteering, it goes in
`core`.

## Decisions worth knowing about

**Matching.** A volunteer's skills and interests are compared with what an opportunity asks for,
weighted 0.65 towards skills and 0.35 towards interests, using Jaccard similarity. Both sides pick
from one fixed catalogue in `core/domain/catalogue.ts`, and the server refuses anything that is not
on it. Before that list existed, "Graphic design", "graphics" and "designing posters" were three
unrelated tags and the score meant nothing.

**Check in.** Attendance uses a rotating code rather than a fixed one. The organiser's screen shows
a QR code that changes every thirty seconds, built with HOTP in `core/security/TotpService.ts`, and
the server accepts the current code or one step either side to allow for clocks that disagree. A
fixed code could be photographed once and sent to people who never turned up.

**Hours.** A volunteer cannot give themselves hours. They are credited either by an organiser
closing a register or by an organiser accepting work that was sent in. An initiative somebody ran
themselves counts as organised on their portfolio, not as verified time, because nobody else
confirmed it.

**Deleting an account.** Deleting does not remove the row. Other people's registers, the hours an
organiser verified and the applications made to an initiative all point at the account, and erasing
it would rewrite other people's records. What goes is the identity: the name, the email, the
password hash and the portfolio link. The row stays so the records around it keep their shape.

**Deactivation takes effect immediately.** The `authenticate` middleware reads the account on every
request instead of trusting the seven day token, so suspending somebody actually suspends them. It
costs one lookup per request, which is worth it.

**Changing the password ends the other sessions.** Every account carries a `tokenVersion`, which
goes up whenever a password is set, and `authenticate` compares it with the version inside the
token. Tokens are stateless, so this is the only way to retire one before it expires. Every route
that sets a password goes through the same `setPassword`, which means an admin's reset revokes
tokens as well without anybody having to remember that separately. The device that made the change
is handed a replacement token in the reply, so the person who just secured their account is not the
first one thrown out of it.

**Briefs.** The optional PDF on an opportunity lives in its own table rather than on the opportunity
row. A megabyte of base64 on the row would be read by every query that lists opportunities and never
needs it.

## Testing

`npm test` runs the unit tests with Vitest: 169 of them across 15 files at the moment, in about a
second. They cover the services, which is where the rules are, using in-memory fakes rather than a
database.

`npm run smoke` is a different thing. It runs against a live API and walks through a whole scenario:
signing people up, applying, approving, checking in and reading the portfolio at the end. It creates
real rows, so `npm run db:cleanup` removes what it made.

## Deployment

Vercel runs the API as a serverless function. `api/index.ts` exports the Express app, `vercel.json`
rewrites every path to it, and the empty `public` folder exists only because Vercel wants an output
directory. Do not delete it.

`docker compose up` from the repository root runs the API and the frontend together, the API on
4000 and the frontend on 8081. The API container applies migrations before it starts, so
`DATABASE_URL` has to be reachable from inside the container, and `backend/.env` has to exist or
compose refuses to start.

If you move either port, move both: the browser is told where the API is when the frontend image is
built, and the API only accepts the origin named in `CLIENT_ORIGIN`. Change one and the page loads
but every request fails.

## What is missing, and what I would fix next

**No email.** Nothing in Fasha sends mail. A forgotten password is handled by a community admin
issuing a temporary one from the user table, which the person replaces when they sign in. That is
honest for a pilot in one sector, where people can walk into the office, but it does not scale past
it.

**Files are stored in the database.** Profile pictures and briefs are base64 in Postgres, with limits
of about 150KB and 1MB. It avoids a second set of credentials and a bucket to manage, and at pilot
size it is fine. At a few hundred accounts it should move to Supabase Storage, which is one column
and one upload call.

**The oversight calendar sends more than it needs.** `GET /opportunities/all` returns full records,
descriptions included, for the last twelve months. At a few hundred rows that is nothing. but when the district ever runs thousands a year, the calendar should ask for titles, dates, status and mode
instead.

**No rate limiting.** Sign in and the forgotten password endpoint can both be called as often as
somebody likes.