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

  await test.step('now it is in Discover like anything else', async () => {
    await volunteer.goto('/discover')
    await volunteer.getByLabel('Search opportunities').fill(title)

    await expect(volunteer.getByRole('button', { name: title })).toBeVisible()
    await shot(volunteer, '3 published after approval')
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
