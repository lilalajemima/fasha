import { expect, test, type Page } from '@playwright/test'
import { PASSWORD, shot, uniqueEmail, uniqueName } from './helpers'

// The first-time guide, from an account that has never seen it. Signed up by
// hand here, because the shared helper closes the guide straight away.

// Counted so that each test signs up with its own address. Two volunteers in
// one run would otherwise share one, and the second sign-up would be refused.
let signedUp = 0

async function signUpWithoutClosingTheGuide(page: Page, role: 'Volunteer' | 'Organisation', name: string) {
  signedUp += 1

  await page.goto('/signup')
  await page.getByRole('button', { name: role }).first().click()
  await page.getByLabel('Full name').fill(name)
  await page.getByLabel('Email address').fill(uniqueEmail(`guide-${role.toLowerCase()}-${signedUp}`))
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Password again').fill(PASSWORD)
  await page.getByRole('button', { name: /Create (volunteer|organisation) account/ }).click()
  await expect(page).not.toHaveURL(/\/signup/)
}

const guide = (page: Page) => page.getByRole('dialog').filter({ hasText: 'Skip guide' })

test('a new volunteer is walked through Fasha one step at a time', async ({ page }) => {
  await signUpWithoutClosingTheGuide(page, 'Volunteer', uniqueName('Ineza'))

  await test.step('it starts on the profile', async () => {
    await expect(guide(page)).toContainText('Step 1 of 5')
    await expect(guide(page)).toContainText('Welcome to Fasha!')
    await expect(page).toHaveURL(/\/profile$/)
    await shot(page, '1 the first step of the guide')
  })

  await test.step('the next step moves to the page it talks about', async () => {
    await page.getByRole('button', { name: "Done, what's next?" }).click()

    await expect(guide(page)).toContainText('Step 2 of 5')
    await expect(guide(page)).toContainText('Opportunities picked for you')
    await expect(page).toHaveURL(/\/discover$/)
  })

  await test.step('going back works too', async () => {
    await page.getByRole('button', { name: 'Back', exact: true }).click()

    await expect(guide(page)).toContainText('Step 1 of 5')
  })

  await test.step('it picks up where it was after a reload', async () => {
    await page.getByRole('button', { name: "Done, what's next?" }).click()
    await expect(guide(page)).toContainText('Step 2 of 5')

    await page.reload()

    await expect(guide(page)).toContainText('Step 2 of 5')
  })

  await test.step('skipped, it stays away', async () => {
    await page.getByRole('button', { name: 'Skip guide' }).click()
    await expect(page.getByRole('button', { name: 'Skip guide' })).toHaveCount(0)

    await page.reload()
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    await page.waitForTimeout(1_000)

    await expect(page.getByRole('button', { name: 'Skip guide' })).toHaveCount(0)
  })

  await test.step('and help brings it back from the start', async () => {
    await page.getByRole('button', { name: 'How this page works' }).click()
    await page.getByRole('button', { name: 'Show me around again' }).click()

    await expect(guide(page)).toContainText('Step 1 of 5')
    await expect(page).toHaveURL(/\/profile$/)
  })

  await test.step('Escape closes it', async () => {
    await page.keyboard.press('Escape')

    await expect(page.getByRole('button', { name: 'Skip guide' })).toHaveCount(0)
  })
})

test('the guide can be followed all the way to the end', async ({ page }) => {
  await signUpWithoutClosingTheGuide(page, 'Volunteer', uniqueName('Gatete'))

  await page.getByRole('button', { name: "Done, what's next?" }).click()

  for (const step of [3, 4, 5]) {
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(guide(page)).toContainText(`Step ${step} of 5`)
  }

  await expect(page).toHaveURL(/\/portfolio$/)
  await page.getByRole('button', { name: 'Finish', exact: true }).click()

  await expect(page.getByRole('button', { name: 'Skip guide' })).toHaveCount(0)
  await page.reload()
  await page.waitForTimeout(1_000)
  await expect(page.getByRole('button', { name: 'Skip guide' })).toHaveCount(0)
})

test('an organisation gets a guide about organising', async ({ page }) => {
  await signUpWithoutClosingTheGuide(page, 'Organisation', uniqueName('Umurava Youth'))

  await expect(guide(page)).toContainText('Step 1 of 5')
  await page.getByRole('button', { name: "Done, what's next?" }).click()

  await expect(guide(page)).toContainText('Post your first opportunity')
  await expect(page).toHaveURL(/\/manage\/opportunities$/)
  await shot(page, '2 the organiser guide')
})