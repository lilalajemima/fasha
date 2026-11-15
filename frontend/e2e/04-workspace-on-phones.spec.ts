import { expect, test } from '@playwright/test'
import { shot, signUp, soon, uniqueEmail, uniqueTitle } from './helpers'

// The workspace tables become a stack of cards on a phone. Run on the Android
// phone only: it is the same layout everywhere, and posting the opportunity
// that fills the table relies on date fields every engine fills differently.
test('an organiser can read and act on their opportunities on a phone', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'pixel-7', 'Phone layout, checked on the Android phone')
  test.setTimeout(90_000)

  const title = uniqueTitle('phone layout')

  await signUp(page, 'organisation', 'Gisozi Reading Club', uniqueEmail('phone'))

  await page.goto('/manage/opportunities/new')
  await page.getByLabel('Opportunity title').fill(title)
  await page.getByLabel('Description').fill('Reading aloud with children at the sector library.')
  await page.getByLabel('Location').fill('Gisozi sector library')
  await page.getByLabel('Sector').selectOption('Gisozi')
  await page.getByLabel('Starts').fill(soon(4, 9))
  await page.getByLabel('Ends').fill(soon(4, 11))
  await page.getByLabel('Maximum volunteers').fill('6')
  await page.getByLabel('Application deadline').fill(soon(3, 17))
  await page.getByRole('button', { name: 'Publish opportunity' }).click()
  await expect(page.getByText(title)).toBeVisible()

  await page.goto('/manage/opportunities')

  // Located by its markup: some browsers stop calling it a table row once it
  // is laid out as a card, which is fine for people and not for a selector.
  const card = page.locator('.data tbody tr', { hasText: title })

  await test.step('each opportunity is a card, with no table header above it', async () => {
    await expect(card).toBeVisible()

    const header = await page.locator('.data thead').first().boundingBox()

    expect(header?.height ?? 0).toBeLessThanOrEqual(1)

    const display = await card.locator('td').first().evaluate(cell => getComputedStyle(cell).display)

    expect(display).toBe('block')
  })

  await test.step('each value is labelled inside the card', async () => {
    const label = await card.locator('td[data-label="State"]').evaluate(
      cell => getComputedStyle(cell, '::before').content,
    )

    expect(label).toBe('"State"')
  })

  await test.step('nothing scrolls sideways', async () => {
    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)

    expect(overflows).toBe(false)
    await shot(page, 'opportunities as cards on a phone')
  })

  await test.step('the button says what it does and goes there', async () => {
    await card.getByRole('link', { name: 'Review applicants' }).click()

    await expect(page).toHaveURL(/\/manage\/opportunities\/.+\/applications$/)
  })

  await test.step('the menu opens and gets you around', async () => {
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await page.getByRole('link', { name: 'Attendance' }).click()

    await expect(page).toHaveURL(/\/manage\/attendance/)
  })
})
