import { expect, test } from '@playwright/test'
import { shot, signUp, soon, uniqueEmail, uniqueTitle } from './helpers'

// The whole point of Fasha in one test: an organisation posts work, a resident
// applies, the organisation accepts them, they turn up and are checked in with
// the rotating code, and the hours land on a portfolio an employer can open.
//
// It runs two browser contexts at once, because the code on the organiser's
// screen is what the volunteer has to type, and that is not something you can
// fake with one session.
test('a volunteer is matched, turns up, and ends up with verified hours', async ({ browser }) => {
  test.setTimeout(90_000)

  const title = uniqueTitle('river clean up')
  const organiserEmail = uniqueEmail('organiser')
  const volunteerEmail = uniqueEmail('volunteer')

  const organiserContext = await browser.newContext()
  const volunteerContext = await browser.newContext()
  const organiser = await organiserContext.newPage()
  const volunteer = await volunteerContext.newPage()

  await test.step('an organisation signs up and posts work', async () => {
    await signUp(organiser, 'organisation', 'Kimironko Community Kitchen', organiserEmail)

    await organiser.goto('/manage/opportunities/new')
    await organiser.getByLabel('Opportunity title').fill(title)
    await organiser.getByLabel('Description').fill(
      'Clearing the banks of the Nyabugogo with the sector youth council.',
    )
    await organiser.getByLabel('Location').fill('Simba Kimironko')
    await organiser.getByLabel('Sector').selectOption('Kimironko')
    await organiser.getByLabel('Starts').fill(soon(3, 8))
    await organiser.getByLabel('Ends').fill(soon(3, 12))
    await organiser.getByLabel('Maximum volunteers').fill('5')
    await organiser.getByLabel('Application deadline').fill(soon(2, 17))

    await shot(organiser, '1 the opportunity before it is published')
    await organiser.getByRole('button', { name: 'Publish opportunity' }).click()

    await expect(organiser.getByText(title)).toBeVisible()
  })

  let opportunityId = ''

  await test.step('a resident finds it and applies', async () => {
    await signUp(volunteer, 'volunteer', 'Amara Mensah', volunteerEmail)

    await volunteer.getByRole('button', { name: title }).click()
    await volunteer.getByRole('link', { name: 'View opportunity' }).click()

    await expect(volunteer.getByRole('heading', { name: title })).toBeVisible()
    opportunityId = volunteer.url().split('/opportunities/')[1]
    expect(opportunityId).toBeTruthy()

    await volunteer.getByLabel('Why would you like to help?').fill(
      'I live two streets away and I have cleared this stretch of river before.',
    )
    await shot(volunteer, '2 the application before it is sent')
    await volunteer.getByRole('button', { name: 'Submit application' }).click()

    await expect(volunteer.getByText('Application sent')).toBeVisible()
  })

  await test.step('the organiser sees the match and accepts', async () => {
    await organiser.goto(`/manage/opportunities/${opportunityId}/applications`)

    await expect(organiser.getByText('Amara Mensah')).toBeVisible()
    await shot(organiser, '3 the applicant with their match score')

    await organiser.getByRole('button', { name: 'Accept', exact: true }).first().click()
    await expect(organiser.getByRole('button', { name: 'Accept', exact: true })).toHaveCount(0)
  })

  let code = ''

  await test.step('the organiser opens the door', async () => {
    await organiser.goto(`/manage/attendance?event=${opportunityId}`)
    await organiser.getByRole('button', { name: 'Open check in' }).click()

    // Printed as "429 439" so somebody can read it out loud.
    const shown = organiser.locator('.codepanel__code')

    await expect(shown).toBeVisible()
    code = ((await shown.textContent()) ?? '').replace(/\s/g, '')

    expect(code).toMatch(/^\d{6}$/)
    await shot(organiser, '4 the rotating check in code')
  })

  await test.step('a code that is not the current one is refused', async () => {
    await volunteer.goto(`/check-in?o=${opportunityId}`)
    await volunteer.getByLabel('Six digit code').fill('000000')
    await volunteer.getByRole('button', { name: 'Check in', exact: true }).click()

    await expect(volunteer.getByRole('alert')).toBeVisible()
    await shot(volunteer, '5 a wrong code is refused')
  })

  await test.step('the volunteer checks in with that code', async () => {
    await volunteer.getByLabel('Six digit code').fill(code)
    await volunteer.getByRole('button', { name: 'Check in', exact: true }).click()

    await expect(volunteer.getByText(/Checked in|Check out/i).first()).toBeVisible()
    await shot(volunteer, '6 checked in')
  })

  await test.step('the register shows them, and the organiser closes it', async () => {
    await organiser.reload()

    const row = organiser.getByRole('row', { name: /Amara Mensah/ })

    await expect(row).toBeVisible()
    await shot(organiser, '7 the register with one volunteer in')

    await row.getByRole('button', { name: 'Check out' }).click()
    await expect(row.getByText('Done')).toBeVisible()
  })

  await test.step('the hours are on the volunteer portfolio', async () => {
    await volunteer.goto('/portfolio')

    await expect(volunteer.getByText(title)).toBeVisible()
    await shot(volunteer, '8 the portfolio with verified hours')
  })

  await organiserContext.close()
  await volunteerContext.close()
})
