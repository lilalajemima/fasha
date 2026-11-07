import { expect, test } from '@playwright/test'
import { shot } from './helpers'

// The same checks in Chromium, Firefox, WebKit and two phones. Nothing here
// signs in.

const PUBLIC_PAGES = [
  { path: '/signin', name: 'sign in' },
  { path: '/signup', name: 'sign up' },
  { path: '/privacy', name: 'privacy' },
  { path: '/forgotten', name: 'forgotten password' },
]

for (const page of PUBLIC_PAGES) {
  test(`${page.name} fits the screen without sideways scrolling`, async ({ page: tab }) => {
    await tab.goto(page.path)

    const overflows = await tab.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    )

    expect(overflows, `${page.name} scrolls sideways`).toBe(false)
    await shot(tab, `${page.name} at this size`)
  })
}

test('the privacy page keeps a readable measure at every width', async ({ page }) => {
  await page.goto('/privacy')

  const width = await page.locator('.policy__body').evaluate(el => el.clientWidth)

  // Narrow enough to read, wide enough not to be a column of single words.
  expect(width).toBeGreaterThan(250)
  expect(width).toBeLessThan(900)
})

test('every form control on sign up has a label a screen reader can read', async ({ page }) => {
  await page.goto('/signup')

  const inputs = page.locator('input:not([type="hidden"])')
  const count = await inputs.count()

  expect(count).toBeGreaterThan(0)

  for (let index = 0; index < count; index += 1) {
    const field = inputs.nth(index)
    const id = await field.getAttribute('id')
    const aria = await field.getAttribute('aria-label')
    const labelled = id ? await page.locator(`label[for="${id}"]`).count() : 0

    expect(Boolean(aria) || labelled > 0, `input ${index} has no label`).toBe(true)
  }
})

test('every button says what it does', async ({ page }) => {
  await page.goto('/signin')

  const buttons = page.locator('button')
  const count = await buttons.count()

  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index)
    const text = ((await button.textContent()) ?? '').trim()
    const aria = await button.getAttribute('aria-label')

    expect(Boolean(text) || Boolean(aria), `button ${index} is unnamed`).toBe(true)
  }
})
