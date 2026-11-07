import { expect, test } from '@playwright/test'
import { shot, signUp, uniqueEmail } from './helpers'

// The portfolio only has value if somebody with no account can open it, so it
// is tested from a browser that has never signed in.
test('a portfolio can be opened by somebody who is not signed in', async ({ browser }) => {
  test.setTimeout(90_000)

  const email = uniqueEmail('portfolio')
  const name = 'Keza Uwase'

  // The share link is only in the clipboard, which needs permission.
  const owner = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write'],
  })
  const page = await owner.newPage()

  await signUp(page, 'volunteer', name, email)

  await page.goto('/portfolio')
  await expect(page.getByRole('heading', { name })).toBeVisible()
  await shot(page, '1 the owner looking at their own portfolio')

  await page.getByRole('button', { name: /Copy link/ }).click()
  await expect(page.getByRole('button', { name: /Link copied/ })).toBeVisible()

  const link = await page.evaluate(() => navigator.clipboard.readText())

  expect(link).toContain('/p/')

  // A separate context: no token, no storage.
  const stranger = await browser.newContext()
  const theirPage = await stranger.newPage()

  await theirPage.goto(link)

  await expect(theirPage.getByRole('heading', { name })).toBeVisible()
  await expect(theirPage.getByText('Hours verified')).toBeVisible()
  await shot(theirPage, '2 the same page seen by a stranger')

  await expect(theirPage.getByRole('link', { name: /Back to Fasha/ })).toHaveCount(0)

  await owner.close()
  await stranger.close()
})

test('a portfolio address that belongs to nobody does not pretend otherwise', async ({ page }) => {
  await page.goto('/p/nobody-has-this-address')

  await expect(page.getByText(/did not load|no longer exists|not found/i).first()).toBeVisible()
})
