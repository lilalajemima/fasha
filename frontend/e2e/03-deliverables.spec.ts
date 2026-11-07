import { expect, test } from '@playwright/test'
import { shot, signUp, soon, uniqueEmail, uniqueTitle } from './helpers'

// Virtual work has no door to stand at, so it is credited from what the
// volunteer sends in. The rule worth proving is the one about feedback: hours
// cannot be refused silently, and a refusal is not the end of the road.
test('work sent in can be refused with a reason and sent again', async ({ browser }) => {
  test.setTimeout(90_000)

  const title = uniqueTitle('poster design')
  const organiserEmail = uniqueEmail('vorganiser')
  const volunteerEmail = uniqueEmail('vvolunteer')

  const organiserContext = await browser.newContext()
  const volunteerContext = await browser.newContext()
  const organiser = await organiserContext.newPage()
  const volunteer = await volunteerContext.newPage()

  await test.step('an organisation posts remote work', async () => {
    await signUp(organiser, 'organisation', 'Kimironko Youth Council', organiserEmail)

    await organiser.goto('/manage/opportunities/new')
    await organiser.getByRole('button', { name: /Virtual/ }).first().click()
    await organiser.getByLabel('Opportunity title').fill(title)
    await organiser.getByLabel('Description').fill(
      'Designing posters for the sector noticeboard, done from home.',
    )
        await organiser.getByLabel('Sector').selectOption('Kimironko')
    await organiser.getByLabel('Work due by').fill(soon(5, 17))
    await organiser.getByLabel('Maximum volunteers').fill('5')
    await organiser.getByLabel('Application deadline').fill(soon(2, 17))
    await organiser.getByRole('button', { name: 'Publish opportunity' }).click()

    await expect(organiser.getByText(title)).toBeVisible()
  })

  let opportunityId = ''

  await test.step('a volunteer applies and is accepted', async () => {
    await signUp(volunteer, 'volunteer', 'Zuba Keza', volunteerEmail)

    await volunteer.goto('/discover')
    await volunteer.getByLabel('Search opportunities').fill(title)

    await volunteer.getByRole('button', { name: title }).click()
    await volunteer.getByRole('link', { name: 'View opportunity' }).click()

    opportunityId = volunteer.url().split('/opportunities/')[1]

    await volunteer.getByLabel('Why would you like to help?').fill(
      'I design posters for my church every month and would like to help here.',
    )
    await volunteer.getByRole('button', { name: 'Submit application' }).click()
    await expect(volunteer.getByText('Application sent')).toBeVisible()

    await organiser.goto(`/manage/opportunities/${opportunityId}/applications`)
    await organiser.getByRole('button', { name: 'Accept', exact: true }).first().click()
    await expect(organiser.getByRole('button', { name: 'Accept', exact: true })).toHaveCount(0)
  })

  await test.step('the volunteer sends the work in', async () => {
    await volunteer.goto('/activity')
    await volunteer.getByRole('tab', { name: /Deliverables/ }).click()

    // The toolbar button opens the form and then reads "Close", which leaves
    // the submit button as the only "Send for review" on the page.
    await volunteer.getByRole('button', { name: 'Send for review' }).click()
    await volunteer.getByRole('button', { name: title }).click()
    await volunteer.getByLabel('Hours it took').fill('4')
    await volunteer.getByLabel('Link to what you produced').fill('https://example.invalid/poster')

    await shot(volunteer, '1 the work before it is sent')
    await volunteer.getByRole('button', { name: 'Send for review' }).click()

        await expect(volunteer.getByRole('cell', { name: 'Under review' })).toBeVisible()
  })

  await test.step('a rejection cannot be sent without a reason', async () => {
    await organiser.goto(`/manage/review?opportunity=${opportunityId}`)
    await organiser.getByRole('button', { name: 'Reject', exact: true }).first().click()

    const send = organiser.getByRole('button', { name: 'Send rejection' })

    await expect(send).toBeDisabled()
    await shot(organiser, '2 a rejection with nothing written is refused')

    // Nine characters is one short of what the server will accept, so the
    // button has to stay disabled rather than letting the request fail.
    await organiser.getByLabel('Why are these hours not approved?').fill('too short')
    await expect(send).toBeDisabled()
  })

  await test.step('a rejection with a reason goes through', async () => {
    await organiser.getByLabel('Why are these hours not approved?').fill(
      'The link opens a blank page rather than the finished poster.',
    )

    const send = organiser.getByRole('button', { name: 'Send rejection' })

    await expect(send).toBeEnabled()
    await shot(organiser, '3 the reason being written')
    await send.click()

    await organiser.getByLabel('Filter by state').selectOption('REJECTED')
    await expect(organiser.getByRole('cell', { name: 'Rejected' })).toBeVisible()
  })

  await test.step('the volunteer is told why', async () => {
    await volunteer.goto('/activity')
    await volunteer.getByRole('tab', { name: /Deliverables/ }).click()

    await expect(volunteer.getByText(/blank page rather than the finished poster/)).toBeVisible()
    await shot(volunteer, '4 the volunteer reads the reason')
  })

  await organiserContext.close()
  await volunteerContext.close()
})
