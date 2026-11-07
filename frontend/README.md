# Fasha web app

What people actually use: the volunteer's side, the organiser's side and the community admin's
side, all in one React application.

React 19 with TypeScript, built by Vite and routed by React Router. There is no UI library and no
CSS framework. The styling is plain CSS with design tokens, which is the main reason it stays
small.

## Features

### Volunteer
- discover opportunities, sorted by match, with filters for format, sector, skill and deadline
- apply with a statement
- my activity: applications, attendance and deliverables in one place, with attempts shown
- check in by scanning a QR code or typing the six digit code
- propose an initiative and run it from inside the initiative page
- a public portfolio with hours, skills and what you organised

### Organisation
- overview with a calendar and what is waiting on you
- create and edit opportunities, with an optional PDF brief
- applicants with match scores and the tags you share
- attendance: open check in, show the rolling code, take the register, export CSV
- deliverables: everything sent in to any of your opportunities in one list

### Community admin
- overview with a calendar of everything in the district
- approvals queue for initiatives proposed by residents
- activity with CSV export
- user management: deactivate, reinstate, reset a password, delete

## Prerequisites

- node 20 or newer
- the API running somewhere

## Installation

```bash
npm install
npm run dev        # http://localhost:5173
```

It expects the API at `http://localhost:4000`. To point it somewhere else, set `VITE_API_URL` in a
`.env` file next to `package.json`.

## Environment variables

| Variable | What it is |
| --- | --- |
| `VITE_API_URL` | Where the API is. Defaults to `http://localhost:4000` |
| `VITE_DEMO_VOLUNTEER_EMAIL` | Fills the demo panel on the sign in page |
| `VITE_DEMO_ORGANISATION_EMAIL` | The same, for an organisation |
| `VITE_DEMO_PASSWORD` | The password both demo accounts share |

Vite reads these at build time, not at run time, so changing one means building again. They also
end up in the bundle, which is fine for demo accounts and not fine for anything secret.

If the three `VITE_DEMO_*` variables are not set, the demo panel does not appear and the privacy
page stops offering demo sign in. Set them wherever you want people to look around without making
an account.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | The dev server, with hot reload |
| `npm run build` | `tsc -b` then `vite build`. This is what Vercel runs |
| `npm run lint` | ESLint over everything |
| `npm run preview` | Serves the built files |
| `npm test` | Unit tests over the pure functions in `lib` |
| `npm run e2e` | Playwright, across three browser engines and two phones |
| `npm run e2e:report` | Opens the last end to end report |
| `npm run lighthouse` | Performance and accessibility on the public pages |

`npm run build` is the one that matters before pushing. It fails on things the dev server ignores,
such as an import or a variable nothing uses.

## Architecture

```
src/
  auth/          who is signed in, and the route guards
  components/    the pieces used everywhere: buttons, fields, icons, pickers
  layouts/       the shell around a signed in page, and the navigation table
  lib/           the logic that is not React: dates, matching display, images, paging
  notifications/ the unread count in the top bar
  pages/         one folder per role
  styles/        tokens, global rules and the shared workspace styles
e2e/             Playwright specs
scripts/         the Lighthouse runner and its summariser
```

`pages` is split by who the page belongs to, not by what it shows:

- `pages/auth` is sign in, sign up and forgotten password
- `pages/volunteer` is discover, my activity, my initiatives, portfolio and check in
- `pages/manage` is the organiser's workspace
- `pages/admin` is the community admin's
- `pages/Profile.tsx` and `pages/Privacy.tsx` sit at the top because they belong to everyone

A volunteer who proposes an initiative runs it too, so three of the organiser's panels are
imported into the volunteer's initiative page rather than copied: `ApplicantsPanel`,
`AttendancePanel` and `DeliverablesPanel`.

## Three things that explain most of the app

**One shell, three workspaces.** `layouts/Shell.tsx` draws the sidebar, the top bar and the help
button for every signed in page. It picks the navigation from the person's role, and
`layouts/navItems.ts` holds that table. The sidebar and the mobile drawer both read it, so neither
can offer a destination the other is missing.

**Guards live on the routes.** `auth/RequireAuth.tsx` exports four guards built from one factory. A
volunteer cannot reach `/manage`, an organiser cannot reach `/admin`, and anybody whose password
was reset by an admin sees nothing but the change form until they replace it.

**Data loading is one hook.** `lib/useGet.ts` fetches, holds loading and error state, and gives
back a `reload`. The `Loaded` component in `components/Loader.tsx` turns that into a spinner, an
error with a retry button, or the page:

```tsx
const feed = useGet<OpportunityView[]>('/opportunities')

return (
  <Loaded state={feed} what="opportunities">
    {items => <List items={items} />}
  </Loaded>
)
```

That is why almost no page handles loading by hand.

## I want to add a feature. What do I do?

Say the API has grown an `urgent` flag and Discover should show it.

**1. Teach the types about it.** `lib/types.ts` is the browser's copy of what the API returns.
Nothing enforces that the two agree, so this is the step people forget. The symptom is `undefined`
where the value should be.

**2. Decide whether it is a page or a piece.** A new URL is a page, in the folder for the role it
belongs to. Something two pages need is a component. Something with no React in it belongs in
`lib`.

**3. Fetch it with `useGet` and wrap the markup in `Loaded`.** Do not write your own loading flags.

**4. Style it with tokens, not colours.** `styles/tokens.css` is the only place a hex value belongs.
Something used on more than one page goes in `styles/workspace.css`; something specific to a page
goes in a CSS file next to it.

**5. Add the route** in `App.tsx`, inside the guard for the role that may see it. Public pages go
above the guards, next to `/signin` and `/p/:slug`.

**6. Add it to the navigation** in `layouts/navItems.ts` if it is a destination. One entry serves
both the sidebar and the drawer.

**7. Give it a title** in `components/DocumentTitle.tsx`. The table is read in order and the first
match wins, so a longer path goes above a shorter one that is a prefix of it.

**8. Build it.**

```bash
npm run build
```

Not just the dev server. The dev server does not typecheck the whole project.

## The parts of lib worth knowing

`calendar.ts` turns opportunities into calendar marks and decides where each one links to. It
takes the current time as an argument rather than reading the clock, so the same opportunity at
the same moment always gives the same answer and it can be tested without waiting for a date.

`roster.ts` builds an event's register by joining the accepted applications to whatever check ins
exist, because somebody who was accepted belongs on the list whether or not they turned up.

`image.ts` crops a profile picture to a square and scales it to 256px in the browser, so what
reaches the server is around 20KB rather than whatever came off a phone camera.

`catalogue.ts` fetches the skills, interests and times of the week from the API rather than
keeping its own copy, so a form cannot offer a tag the server would refuse.

`useGet.ts` and `ApiClient.ts` are the only two files that know how a request is made. The token
goes on in `ApiClient`, read from `TokenStore`, which is `localStorage` behind a small interface.

## Styling

`styles/tokens.css` is the single source of colour, spacing and type. No component hard codes a
colour. The brand is Rwandan red with imigongo black and white, and the status colours mean one
thing each: green done, amber waiting, blue in flight, red stopped, grey inactive.

`styles/workspace.css` holds the shared furniture: tables, toolbars, banners, cards, the calendar
grid.

Two rules in there are easy to trip over:

- banners are full width, which only works when the banner is a sibling of the content column
  rather than inside it
- below 860px the month grid hides the text next to each dot, because a cell is 62px wide and only
  the dots fit. anything else using those classes has to put the text back, which is what
  `pages/manage/Calendar.css` does for the week and day views

## Testing

### Unit tests

```bash
npm test
```

58 tests over the pure functions in `lib`: `calendar.ts`, `roster.ts`, `paging.ts`, `format.ts`,
`umuganda.ts`. No React, no DOM, under a second.

`vitest.config.ts` pins the timezone to `Africa/Kigali`. Several of these format dates, and
without pinning it they pass here and fail in CI.

### End to end

```bash
npx playwright install        # first time only
npm run e2e
npm run e2e:report
```

The app has to be running first. The default base URL is `http://localhost:5173`; to test the
Docker build instead:

```bash
E2E_BASE_URL=http://localhost:8081 npm run e2e
```

102 tests across five projects: Chromium, Firefox, WebKit, a Pixel 7 and an iPhone 13.

| Spec | Runs on | What it covers |
| --- | --- | --- |
| `01-auth` | all five | The privacy page without an account, the password reveal, mismatched passwords, the route guards |
| `02-journey` | Chromium | Publish, apply, accept, open check in, refuse a wrong code, check in, close the register, hours on the portfolio |
| `03-deliverables` | Chromium | Work sent in, refused with a reason, the volunteer reads why |
| `04-responsive` | all five | No sideways scrolling, readable line length, every input labelled, every button named |
| `05-accessibility` | all five | axe-core at WCAG 2.1 AA, plus a keyboard path |
| `06-portfolio` | Chromium | The public portfolio from a browser that has never signed in |
| `07-admin` | Chromium | A resident's initiative is invisible until the district approves it |

Rendering differs between engines, so those checks run everywhere. Behaviour does not, so the
journeys run once.

The admin specs need an account from the seed, which cannot be made through the UI:

```bash
export E2E_ADMIN_EMAIL=your-admin@example.rw
export E2E_ADMIN_PASSWORD=your-seed-password
npm run e2e
```

Without those they skip rather than fail.

Every run writes traces and screenshots to `e2e-report/`. Do not point it at production: it
creates accounts, opportunities and attendance rows and nothing cleans them up. Test accounts all
use `e2e-...@example.invalid`, so they are easy to find.

### Lighthouse

```bash
npm run lighthouse
```

Three public pages, mobile and desktop, three runs each against the deployed site. Every figure in
the summary is the median of the runs rather than the best, because Lighthouse swings ten points
between identical runs.

To measure something else:

```bash
npm run lighthouse -- http://localhost:8081
PAGES="/signin /signup /privacy /p/some-slug" npm run lighthouse
```

Only pages reachable without signing in can be measured, because Lighthouse drives a browser with
no session. Those are also the lightest pages in the app.

## The privacy page

`pages/Privacy.tsx` is a public page at `/privacy`, linked from sign in, sign up, the forgotten
password page and the sidebar. It says what Fasha collects, who can see it, where it is kept and
how to get rid of it, and it points anybody who would rather not hand over their details at the
demo accounts.

Everything on it is a claim about how the code behaves. If the storage, the sharing or the
deletion behaviour changes, that page changes in the same commit.

## Known limitations

- a slow connection shows a spinner rather than a loading skeleton
- accessibility is checked by two automated tools, which find about a third of what is wrong
  between them. nothing has been through a screen reader properly
- the admin pages page through everything in the browser rather than asking the server for one
  page at a time. fine for this pilot but it has to be scaled
- check in needs a connection at the moment somebody scans. queuing scans locally would fix it
- there is no `.env.example`, so the four `VITE_` variables are only written down here

## Common issues

**Issue: the page loads but every request fails**

- the API's `CLIENT_ORIGIN` does not match where the page is served from
- the browser cannot tell JavaScript the difference between a CORS rejection and a dead server, so
  the app says "cannot reach the server" for both
- check with `curl -i -H "Origin: http://localhost:5173" http://localhost:4000/health` and look at
  `access-control-allow-origin`

**Issue: Playwright says no projects found**

- you are not in the `frontend` folder. the config lives there

**Issue: the e2e tests pass locally but the deployed site is missing the change**

- Vercel builds what is on GitHub. `git status -sb` shows whether you have unpushed commits

**Issue: `npm --prefix frontend install` creates a `frontend/frontend` folder**

- you were already inside `frontend`. use plain `npm install` when you are in the folder

**Issue: VS Code underlines `process` in the e2e specs**

- the specs need their own tsconfig. `e2e/tsconfig.json` sets `types: ["node"]`, and
  `playwright.config.ts` is listed in `tsconfig.node.json`
- the tests run fine either way. Playwright type checks them itself