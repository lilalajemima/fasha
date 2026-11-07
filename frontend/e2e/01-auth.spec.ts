import { expect, test } from '@playwright/test'
import { shot } from './helpers'

// Nothing here creates an account, so it is safe on all five projects.

test.describe('getting in, and deciding whether to', () => {
  test('the privacy page opens without signing in', async ({ page }) => {
    await page.goto('/privacy')

    await expect(page.getByRole('heading', { name: 'Privacy', level: 1 })).toBeVisible()
    await expect(page.getByText('You do not have to give me anything')).toBeVisible()
    await shot(page, 'privacy page')
  })

  test('sign in links to the privacy page', async ({ page }) => {
    await page.goto('/signin')
    await page.getByRole('link', { name: /What Fasha does with your data/ }).click()

    await expect(page).toHaveURL(/\/privacy/)
  })

  test('a password can be revealed and hidden again', async ({ page }) => {
    await page.goto('/signin')

    const password = page.getByLabel('Password', { exact: true })

    await password.fill('a-secret-value')
    await expect(password).toHaveAttribute('type', 'password')

    await page.getByRole('button', { name: 'Show password' }).click()
    await expect(password).toHaveAttribute('type', 'text')
    await shot(page, 'password revealed')

    await page.getByRole('button', { name: 'Hide password' }).click()
    await expect(password).toHaveAttribute('type', 'password')
  })

  test('sign up says so when the two passwords differ', async ({ page }) => {
    await page.goto('/signup')

    await page.getByLabel('Password', { exact: true }).fill('one-password')
    await page.getByLabel('Password again').fill('a-different-one')

    await expect(page.getByText('These do not match yet.')).toBeVisible()
    await shot(page, 'passwords do not match')
  })

  test('the forgotten password page explains what happens instead of an email', async ({ page }) => {
    await page.goto('/forgotten')

    await expect(page.getByRole('heading', { name: /Forgotten your password/ })).toBeVisible()
    await expect(page.getByText(/community admins/)).toBeVisible()
  })

  test('a signed out visitor cannot reach a workspace', async ({ page }) => {
    await page.goto('/manage')

    await expect(page).toHaveURL(/\/signin/)
  })

  test('a signed out visitor cannot reach the admin pages', async ({ page }) => {
    await page.goto('/admin/users')

    await expect(page).toHaveURL(/\/signin/)
  })
})
