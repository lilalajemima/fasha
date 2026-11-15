import { expect, test } from '@playwright/test'
import { shot, signInAs, signUp, soon, uniqueEmail, uniqueName, uniqueTitle } from './helpers'

// Sign up only makes volunteers and organisations, so an admin has to come
// from the seed. Without one these skip rather than fail.
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD

test.skip(
  !ADMIN_EMAIL || !ADMIN_PASSWORD,
  'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run the oversight tests',
)

// An organisation's work publishes straight away, so nothing else here touches
// the approval queue a resident's initiative has to pass through.
test('an initiative proposed by a resident waits for the district', async ({ browser }) => {
  test.setTimeout(120_000)

  const title = uniqueTitle('street lighting walk')
  const volunteerEmail = uniqueEmail('proposer')

  const volunteerContext = await browser.newContext()
  const adminContext = await browser.newContext()

  const volunteer = await volunteerContext.newPage()
  const admin = await adminContext.newPage()

  await test.step('a resident proposes it', async () => {
    await signUp(volunteer, 'volunteer', 'Mugisha Hirwa', volunteerEmail)

    await volunteer.goto('/initiatives/new')
    await volunteer.getByLabel('Opportunity title').fill(title)
    await volunteer.getByLabel('Description').fill(
      'Walking the unlit stretch between the market and the clinic to map it.',
    )
    await volunteer.getByLabel('Location').fill('Kimironko market')
    await volunteer.getByLabel('Sector').selectOption('Kimironko')
    await volunteer.getByLabel('Starts').fill(soon(6, 18))
    await volunteer.getByLabel('Ends').fill(soon(6, 20))
    await volunteer.getByLabel('Maximum volunteers').fill('8')
    await volunteer.getByLabel('Application deadline').fill(soon(4, 17))

    await volunteer.getByRole('button', { name: 'Submit for approval' }).click()
    await expect(volunteer.getByText(title)).toBeVisible()
    await shot(volunteer, '1 proposed, waiting for the district')
  })

  await test.step('nobody else can see it yet', async () => {
    await volunteer.goto('/discover')
    await volunteer.getByLabel('Search opportunities').fill(title)

    await expect(volunteer.getByRole('button', { name: title })).toHaveCount(0)
  })

  await test.step('the district approves it', async () => {
    await signInAs(admin, ADMIN_EMAIL!, ADMIN_PASSWORD!)

    await admin.goto('/admin/approvals')
    await admin.getByLabel('Search the queue').fill(title)

    await expect(admin.getByText(title)).toBeVisible()
    await shot(admin, '2 the proposal in the queue')

    await admin.getByRole('button', { name: 'Approve and publish' }).first().click()
    await expect(admin.getByRole('button', { name: 'Approve and publish' })).toHaveCount(0)
  })

  await test.step('the decision stays in the approvals history', async () => {
    await admin.getByLabel('Showing').selectOption('approved')

    await expect(admin.getByText(title)).toBeVisible()
    await shot(admin, '3 the approved proposal in the history')

    await admin.getByLabel('Showing').selectOption('rejected')

    await expect(admin.getByText(title)).toHaveCount(0)
  })

  await test.step('a period that ended before it was proposed leaves it out', async () => {
    await admin.getByLabel('Showing').selectOption('approved')
    await admin.getByLabel('Period', { exact: true }).selectOption('custom')
    await admin.getByLabel('From', { exact: true }).fill('2025-01-01')
    await admin.getByLabel('To', { exact: true }).fill('2025-01-31')

    await expect(admin.getByText(title)).toHaveCount(0)

    await admin.getByLabel('Period', { exact: true }).selectOption('all')

    await expect(admin.getByText(title)).toBeVisible()
  })

  await test.step('now it is in Discover like anything else', async () => {
    await volunteer.goto('/discover')
    await volunteer.getByLabel('Search opportunities').fill(title)

    await expect(volunteer.getByRole('button', { name: title })).toBeVisible()
    await shot(volunteer, '4 published after approval')
  })

  await test.step('it is not in the activity report until it has happened', async () => {
    await admin.goto('/admin/activity')
    await expect(admin.getByRole('region', { name: 'What happened in this period' })).toBeVisible()
    await admin.getByLabel('Search every opportunity').fill(title)

    await expect(admin.locator('.data tbody tr', { hasText: title })).toHaveCount(0)
  })

  await volunteerContext.close()
  await adminContext.close()
})

test('the district can find an account in the user table', async ({ browser }) => {
  test.setTimeout(90_000)

  const email = uniqueEmail('listed')
  const name = uniqueName('Nshuti')

  const volunteerContext = await browser.newContext()
  const adminContext = await browser.newContext()
  const volunteer = await volunteerContext.newPage()
  const admin = await adminContext.newPage()

  await signUp(volunteer, 'volunteer', name, email)

  await signInAs(admin, ADMIN_EMAIL!, ADMIN_PASSWORD!)
  await admin.goto('/admin/users')
  await admin.getByLabel('Search accounts').fill(name)

  await expect(admin.getByText(name)).toBeVisible()
  await shot(admin, 'the new account in the user table')

  await volunteerContext.close()
  await adminContext.close()
})

test('an organisation cannot reach the oversight pages', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  await signUp(page, 'organisation', 'Not An Admin Ltd', uniqueEmail('notadmin'))
  await page.goto('/admin/users')

  await expect(page).not.toHaveURL(/\/admin/)

  await context.close()
})

// The activity report only lists what has already happened, and the API will
// not take a date in the past, so this cannot make its own event. It reports
// on whatever is already there, and says so plainly when nothing is.
test('the district can report on one event by itself', async ({ browser }) => {
  const context = await browser.newContext()

  // A report opens the print dialog, which would stop the test. Count the
  // calls instead; the report itself is still drawn on the page.
  await context.addInitScript(() => {
    const counted = window as unknown as { printed: number }

    counted.printed = 0
    window.print = () => {
      counted.printed += 1
    }
  })

  const admin = await context.newPage()

  await signInAs(admin, ADMIN_EMAIL!, ADMIN_PASSWORD!)
  await admin.goto('/admin/activity')
  await expect(admin.getByRole('region', { name: 'What happened in this period' })).toBeVisible()

  const rows = admin.locator('.data tbody tr')

  test.skip((await rows.count()) === 0, 'Needs at least one event in the past. Run it after npm run db:seed:video, or on a database that has some history.')

  const first = rows.first()
  const title = ((await first.locator('.data__title').textContent()) ?? '').trim()

  await first.getByRole('button', { name: 'Report' }).click()

  await expect.poll(() => admin.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1)
  await expect(admin.locator('.report')).toContainText(title)
  await expect(admin.locator('.report')).toContainText('What happened')
  await shot(admin, 'the report for one event')

  await context.close()
})