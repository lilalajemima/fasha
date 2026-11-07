import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { shot } from './helpers'

// An automated scan finds about a third of what is wrong with a page, so a
// clean run means the mechanical faults are absent, not that Fasha is usable
// with a screen reader.

const PAGES = [
  { path: '/signin', name: 'sign in' },
  { path: '/signup', name: 'sign up' },
  { path: '/privacy', name: 'privacy' },
  { path: '/forgotten', name: 'forgotten password' },
]

for (const entry of PAGES) {
  test(`${entry.name} has no automatically detectable accessibility faults`, async ({ page }) => {
    await page.goto(entry.path)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    await test.info().attach(`axe ${entry.name}`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    })

    if (results.violations.length > 0) await shot(page, `${entry.name} with faults`)

    expect(
      results.violations.map(violation => `${violation.id}: ${violation.help}`),
    ).toEqual([])
  })
}

test('a keyboard alone can get through the sign in form', async ({ page }) => {
  await page.goto('/signin')

  await page.getByLabel('Email address').focus()
  await page.keyboard.type('someone@example.invalid')
  await page.keyboard.press('Tab')
  await page.keyboard.type('a-password')

  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('a-password')
})
