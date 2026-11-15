import { expect, test } from '@playwright/test'
import { PASSWORD, shot, signInAs, signUp, uniqueEmail, uniqueName } from './helpers'

// What happens on a connection that drops, which in Kigali is not rare. These
// move between pages inside the app rather than reloading, so they work on
// the dev server too, where there is no service worker.

test('a page seen once still shows when the connection drops, and says it may be old', async ({ context, page }) => {
  await signUp(page, 'volunteer', uniqueName('Mutesi'), uniqueEmail('offline'))

  // Discover has loaded once, so there is a copy of it to fall back on.
  await expect(page.getByRole('heading', { name: 'Where can I help next?' })).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.getByRole('link', { name: 'My activity' }).first().click()
  await expect(page).toHaveURL(/\/activity$/)

  await test.step('the app says it is offline', async () => {
    await context.setOffline(true)

    await expect(page.getByText('You are offline.')).toBeVisible()
  })

  await test.step('a page seen before comes from the saved copy, marked as such', async () => {
    await page.getByRole('link', { name: 'Discover' }).first().click()

    await expect(page.getByRole('heading', { name: 'Where can I help next?' })).toBeVisible()
    await expect(page.getByText(/Fasha could not be reached, so this is the copy saved/)).toBeVisible()
    await shot(page, '1 discover from the saved copy')
  })

  await test.step('the note goes once the connection is back', async () => {
    await context.setOffline(false)

    await expect(page.getByText('You are offline.')).toHaveCount(0)
  })
})

test('a half-written opportunity survives a reload, and is gone after signing out', async ({ page }) => {
  const email = uniqueEmail('drafts')
  const title = `Draft ${uniqueName('river walk')}`

  await signUp(page, 'organisation', uniqueName('Nyabugogo Collective'), email)
  await page.goto('/manage/opportunities/new')

  await page.getByLabel('Opportunity title').fill(title)
  await page.getByLabel('Description').fill('Half written when the power went.')

  await test.step('a reload keeps what was typed', async () => {
    await page.reload()

    await expect(page.getByLabel('Opportunity title')).toHaveValue(title)
    await expect(page.getByLabel('Description')).toHaveValue('Half written when the power went.')
  })

  await test.step('signing out throws it away, so the next person on this phone never sees it', async () => {
    await page.getByRole('button', { name: 'Sign out' }).first().click()
    await expect(page).toHaveURL(/\/signin/)

    await signInAs(page, email, PASSWORD)
    await page.goto('/manage/opportunities/new')

    await expect(page.getByLabel('Opportunity title')).toHaveValue('')
  })
})
