import { expect, test, type Page } from '@playwright/test'

// A fresh identity per run, so two runs against one database do not collide.
const RUN = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const PASSWORD = 'e2e-password-2026'

export function uniqueEmail(role: string): string {
  return `e2e-${role}-${RUN}@example.invalid`
}

export function uniqueTitle(what: string): string {
  return `E2E ${what} ${RUN}`
}

export function uniqueName(first: string): string {
  return `${first} ${RUN}`
}

export async function shot(page: Page, name: string): Promise<void> {
  await test.info().attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  })
}

type Role = 'volunteer' | 'organisation'

export async function signUp(page: Page, role: Role, name: string, email: string): Promise<void> {
  await page.goto('/signup')

  await page.getByRole('button', { name: role === 'volunteer' ? 'Volunteer' : 'Organisation' })
    .first()
    .click()

  await page.getByLabel('Full name').fill(name)
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Password again').fill(PASSWORD)
  await page.getByRole('button', { name: /Create (volunteer|organisation) account/ }).click()

  await expect(page).not.toHaveURL(/\/signup/)
}

export async function signInAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/signin')
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).not.toHaveURL(/\/signin/)
}

// The format a datetime-local input wants.
export function soon(daysAhead: number, hour = 9): string {
  const when = new Date()

  when.setDate(when.getDate() + daysAhead)
  when.setHours(hour, 0, 0, 0)

  const pad = (value: number) => String(value).padStart(2, '0')

  return `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}T${pad(hour)}:00`
}