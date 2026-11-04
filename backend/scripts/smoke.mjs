const baseUrl = (process.env.API_URL ?? 'http://localhost:4000').replace(/\/$/, '')
const adminEmail = process.env.SMOKE_ADMIN_EMAIL ?? ''
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD ?? ''
const stamp = Date.now()

let passed = 0
let failed = 0

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1
    console.log(`  pass  ${name}`)
    return true
  }

  failed += 1
  console.log(`  FAIL  ${name}${detail ? `  (${detail})` : ''}`)
  return false
}

async function call(method, path, { token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()

  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = { error: text }
  }

  return { status: response.status, body: payload }
}

function list(value) {
  return Array.isArray(value) ? value : []
}

function inDays(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

function account(label, role) {
  return {
    name: `Smoke ${label} ${stamp}`,
    email: `smoke-${label}-${stamp}@fasha.test`,
    password: 'smoke-test-password',
    role,
  }
}

function draftOpportunity(overrides = {}) {
  return {
    title: `Smoke opportunity ${stamp}`,
    description: 'A smoke test opportunity created to check the API end to end.',
    mode: 'PHYSICAL',
    location: 'Kimironko',
    maxCapacity: 1,
    applicationDeadline: inDays(7),
    startsAt: inDays(8),
    endsAt: inDays(9),
    sector: 'Kimironko',
    requiredSkills: ['Teamwork'],
    categories: ['Environment'],
    ...overrides,
  }
}

const statement = 'I live nearby and I can bring my own tools on the day.'

async function main() {
  console.log(`Smoke testing ${baseUrl}\n`)

  console.log('health')
  const health = await call('GET', '/health')
  if (!check('the server answers', health.status === 200, `status ${health.status}`)) {
    console.log('\nThe API is not reachable. Start it with npm run dev and try again.')
    process.exit(1)
  }
  check('the database answers', health.body?.status === 'ok', JSON.stringify(health.body))

  console.log('\naccounts')
  const volunteerAccount = account('volunteer', 'VOLUNTEER')
  const secondAccount = account('second', 'VOLUNTEER')
  const organisationAccount = account('organisation', 'ORGANISATION')

  const registered = await call('POST', '/auth/register', { body: volunteerAccount })
  check('a volunteer can register', registered.status === 201, `status ${registered.status}`)
  check('registering returns a token', typeof registered.body?.token === 'string')

  const second = await call('POST', '/auth/register', { body: secondAccount })
  const organisation = await call('POST', '/auth/register', { body: organisationAccount })
  check('an organisation can register', organisation.status === 201, `status ${organisation.status}`)

  const duplicate = await call('POST', '/auth/register', { body: volunteerAccount })
  check('the same email cannot register twice', duplicate.status === 409, `status ${duplicate.status}`)

  const shortPassword = await call('POST', '/auth/register', {
    body: { ...account('weak', 'VOLUNTEER'), password: 'short' },
  })
  check('a short password is refused', shortPassword.status === 400, `status ${shortPassword.status}`)

  const wrongPassword = await call('POST', '/auth/login', {
    body: { email: volunteerAccount.email, password: 'not-the-password' },
  })
  check('the wrong password is refused', wrongPassword.status === 401, `status ${wrongPassword.status}`)

  const login = await call('POST', '/auth/login', {
    body: { email: volunteerAccount.email, password: volunteerAccount.password },
  })
  check('a volunteer can sign in', login.status === 200, `status ${login.status}`)

  const volunteerToken = login.body?.token
  const secondToken = second.body?.token
  const organisationToken = organisation.body?.token

  console.log('\nsessions')
  const anonymous = await call('GET', '/auth/me')
  check('no token is refused', anonymous.status === 401, `status ${anonymous.status}`)

  const forged = await call('GET', '/auth/me', { token: `${volunteerToken}x` })
  check('a tampered token is refused', forged.status === 401, `status ${forged.status}`)

  const me = await call('GET', '/auth/me', { token: volunteerToken })
  check('a token identifies the account', me.body?.user?.email === volunteerAccount.email)
  check('a volunteer has a profile', me.body?.profile !== null)

  const organisationMe = await call('GET', '/auth/me', { token: organisationToken })
  check('an organisation has no volunteer profile', organisationMe.body?.profile === null)

  console.log('\nprofile')
  const emptyUpdate = await call('PATCH', '/profile', { token: volunteerToken, body: {} })
  check('an empty update is refused', emptyUpdate.status === 400, `status ${emptyUpdate.status}`)

  const updated = await call('PATCH', '/profile', {
    token: volunteerToken,
    body: { skills: ['Teamwork', 'Graphic design'], interests: ['Environment'], location: 'Kimironko' },
  })
  check('skills are saved', updated.body?.profile?.skills?.includes('Graphic design'))
  check('location is saved', updated.body?.profile?.location === 'Kimironko')

  const cleared = await call('PATCH', '/profile', { token: volunteerToken, body: { location: null } })
  check('a field can be cleared', cleared.body?.profile?.location === null)
  check('clearing one field leaves the others', cleared.body?.profile?.skills?.length === 2)

  const organisationSkills = await call('PATCH', '/profile', {
    token: organisationToken,
    body: { skills: ['Teamwork'] },
  })
  check('an organisation cannot hold skills', organisationSkills.status === 403, `status ${organisationSkills.status}`)

  console.log('\nopportunities')
  const published = await call('POST', '/opportunities', {
    token: organisationToken,
    body: draftOpportunity({ title: `Organisation post ${stamp}` }),
  })
  check('an organisation posts straight to the feed', published.body?.status === 'PUBLISHED', JSON.stringify(published.body))

  const proposal = await call('POST', '/opportunities', {
    token: volunteerToken,
    body: draftOpportunity({ title: `Volunteer proposal ${stamp}` }),
  })
  check('a volunteer proposal waits for approval', proposal.body?.status === 'PENDING_APPROVAL')

  const noLocation = await call('POST', '/opportunities', {
    token: organisationToken,
    body: draftOpportunity({ location: null }),
  })
  check('a physical opportunity needs a location', noLocation.status === 400, `status ${noLocation.status}`)

  const pastDeadline = await call('POST', '/opportunities', {
    token: organisationToken,
    body: draftOpportunity({ applicationDeadline: inDays(-1) }),
  })
  check('a deadline in the past is refused', pastDeadline.status === 400, `status ${pastDeadline.status}`)

  const feed = await call('GET', '/opportunities', { token: volunteerToken })
  const feedIds = list(feed.body).map(entry => entry.id)
  check('the feed shows the published post', feedIds.includes(published.body?.id))
  check('the feed hides the unapproved proposal', !feedIds.includes(proposal.body?.id))
  check('every card carries a match score', list(feed.body).every(entry => typeof entry.matchScore === 'number'))

  const scored = list(feed.body).find(entry => entry.id === published.body?.id)
  check('the score reflects the saved skills', (scored?.matchScore ?? 0) > 0, `score ${scored?.matchScore}`)

  const organisationFeed = await call('GET', '/opportunities', { token: organisationToken })
  check('an organisation feed carries no score', list(organisationFeed.body).every(entry => entry.matchScore === undefined))

  const sortedDescending = list(feed.body).every(
    (entry, index, all) => index === 0 || all[index - 1].matchScore >= entry.matchScore,
  )
  check('the feed is sorted best match first', sortedDescending)

  const searched = await call('GET', `/opportunities?q=${encodeURIComponent('Organisation post')}`, {
    token: volunteerToken,
  })
  check('search narrows the feed', list(searched.body).some(entry => entry.id === published.body?.id))

  const mine = await call('GET', '/opportunities/mine', { token: volunteerToken })
  check('mine lists what I created', list(mine.body).some(entry => entry.id === proposal.body?.id))

    console.log('\napproval')
  const queueAsVolunteer = await call('GET', '/opportunities/pending', { token: volunteerToken })
  check('a volunteer cannot see the queue', queueAsVolunteer.status === 403, `status ${queueAsVolunteer.status}`)

  // Review belongs to the community admin, not to organisations.
  const queueAsOrganisation = await call('GET', '/opportunities/pending', { token: organisationToken })
  check('an organisation cannot see the queue', queueAsOrganisation.status === 403, `status ${queueAsOrganisation.status}`)

  const adminLogin = adminEmail
    ? await call('POST', '/auth/login', { body: { email: adminEmail, password: adminPassword } })
    : { status: 0, body: null }
  const adminToken = adminLogin.body?.token

  if (!adminToken) {
    console.log('  skip  the review queue needs SMOKE_ADMIN_EMAIL and SMOKE_ADMIN_PASSWORD')
  } else {
    check('a community admin can sign in', adminLogin.status === 200, `status ${adminLogin.status}`)

    const queue = await call('GET', '/opportunities/pending', { token: adminToken })
    check('the proposal is in the queue', list(queue.body).some(entry => entry.id === proposal.body?.id))

    // reviewNote is sent on every decision; null means the admin left no feedback.
    const approved = await call('PATCH', `/opportunities/${proposal.body?.id}/status`, {
      token: adminToken,
      body: { decision: 'APPROVE', reviewNote: null },
    })
    check('approving publishes it', approved.body?.status === 'PUBLISHED', JSON.stringify(approved.body))

    const approvedTwice = await call('PATCH', `/opportunities/${proposal.body?.id}/status`, {
      token: adminToken,
      body: { decision: 'APPROVE', reviewNote: null },
    })
    check('it cannot be approved twice', approvedTwice.status === 409, `status ${approvedTwice.status}`)
  }

  console.log('\napplications')
  const organisationApplying = await call('POST', `/opportunities/${published.body?.id}/applications`, {
    token: organisationToken,
    body: { motivationStatement: statement },
  })
  check('an organisation cannot apply', organisationApplying.status === 403, `status ${organisationApplying.status}`)

  const shortStatement = await call('POST', `/opportunities/${published.body?.id}/applications`, {
    token: volunteerToken,
    body: { motivationStatement: 'too short' },
  })
  check('a short statement is refused', shortStatement.status === 400, `status ${shortStatement.status}`)

  const ownOpportunity = await call('POST', `/opportunities/${proposal.body?.id}/applications`, {
    token: volunteerToken,
    body: { motivationStatement: statement },
  })
  check('you cannot apply to your own opportunity', ownOpportunity.status === 409, `status ${ownOpportunity.status}`)

  const application = await call('POST', `/opportunities/${published.body?.id}/applications`, {
    token: volunteerToken,
    body: { motivationStatement: statement },
  })
  check('a volunteer can apply', application.status === 201, `status ${application.status}`)
  check('a new application is pending', application.body?.status === 'PENDING')

  const applyTwice = await call('POST', `/opportunities/${published.body?.id}/applications`, {
    token: volunteerToken,
    body: { motivationStatement: statement },
  })
  check('the same volunteer cannot apply twice', applyTwice.status === 409, `status ${applyTwice.status}`)

  const secondApplication = await call('POST', `/opportunities/${published.body?.id}/applications`, {
    token: secondToken,
    body: { motivationStatement: statement },
  })
  check('a second volunteer can apply', secondApplication.status === 201, `status ${secondApplication.status}`)

  const applicantsAsVolunteer = await call('GET', `/opportunities/${published.body?.id}/applications`, {
    token: volunteerToken,
  })
  check('an applicant cannot see the list', applicantsAsVolunteer.status === 403, `status ${applicantsAsVolunteer.status}`)

  const applicants = await call('GET', `/opportunities/${published.body?.id}/applications`, {
    token: organisationToken,
  })
  check('the organiser sees both applicants', list(applicants.body).length === 2, `got ${list(applicants.body).length}`)

  const ownApplications = await call('GET', '/applications/mine', { token: volunteerToken })
  check('a volunteer sees their own applications', list(ownApplications.body).length >= 1)

  console.log('\ncapacity')
  const acceptedFirst = await call('PATCH', `/applications/${application.body?.id}/status`, {
    token: organisationToken,
    body: { decision: 'ACCEPT' },
  })
  check('the first applicant is accepted', acceptedFirst.body?.status === 'ACCEPTED', JSON.stringify(acceptedFirst.body))

  const acceptedSecond = await call('PATCH', `/applications/${secondApplication.body?.id}/status`, {
    token: organisationToken,
    body: { decision: 'ACCEPT' },
  })
  check('the place beyond capacity is refused', acceptedSecond.status === 409, `status ${acceptedSecond.status}`)

  const rejected = await call('PATCH', `/applications/${secondApplication.body?.id}/status`, {
    token: organisationToken,
    body: { decision: 'REJECT' },
  })
  check('a rejection still works when full', rejected.body?.status === 'REJECTED')

  const decidedTwice = await call('PATCH', `/applications/${secondApplication.body?.id}/status`, {
    token: organisationToken,
    body: { decision: 'ACCEPT' },
  })
  check('an application cannot be decided twice', decidedTwice.status === 409, `status ${decidedTwice.status}`)

  const strangerWithdraw = await call('PATCH', `/applications/${application.body?.id}/withdraw`, {
    token: secondToken,
  })
  check('you cannot withdraw someone else', strangerWithdraw.status === 403, `status ${strangerWithdraw.status}`)

  const withdrawn = await call('PATCH', `/applications/${application.body?.id}/withdraw`, {
    token: volunteerToken,
  })
  check('the applicant can withdraw', withdrawn.body?.status === 'WITHDRAWN')

  console.log('\nattendance')
  const session = await call('POST', '/opportunities', {
    token: organisationToken,
    body: draftOpportunity({ title: `Attendance smoke ${stamp}`, maxCapacity: 2 }),
  })
  const sessionId = session.body?.id

  const joining = await call('POST', `/opportunities/${sessionId}/applications`, {
    token: volunteerToken,
    body: { motivationStatement: statement },
  })
  await call('PATCH', `/applications/${joining.body?.id}/status`, {
    token: organisationToken,
    body: { decision: 'ACCEPT' },
  })

  const codeAsVolunteer = await call('POST', `/opportunities/${sessionId}/checkin-code`, {
    token: volunteerToken,
  })
  check('a volunteer cannot open check in', codeAsVolunteer.status === 403, `status ${codeAsVolunteer.status}`)

  const opened = await call('POST', `/opportunities/${sessionId}/checkin-code`, {
    token: organisationToken,
  })
  check('the organiser gets a six digit code', /^\d{6}$/.test(opened.body?.code ?? ''), JSON.stringify(opened.body))
  check('the code comes with a countdown', opened.body?.secondsRemaining > 0)
  check('a QR image comes back', (opened.body?.qrSvg ?? '').startsWith('<svg'))
  check('the QR holds a link a phone can open', (opened.body?.payload ?? '').startsWith('http'),
    opened.body?.payload)

  const wrongCode = await call('POST', `/opportunities/${sessionId}/checkins`, {
    token: volunteerToken,
    body: { code: '000000' },
  })
  check('a wrong code is refused', wrongCode.status === 401, `status ${wrongCode.status}`)

  const uninvited = await call('POST', `/opportunities/${sessionId}/checkins`, {
    token: secondToken,
    body: { code: opened.body?.code },
  })
  check('someone with no accepted place cannot check in', uninvited.status === 403, `status ${uninvited.status}`)

  const checkedIn = await call('POST', `/opportunities/${sessionId}/checkins`, {
    token: volunteerToken,
    body: { code: opened.body?.code },
  })
  check('the current code checks a volunteer in', checkedIn.status === 201, JSON.stringify(checkedIn.body))
  check('the check in is marked as a scan', checkedIn.body?.method === 'QR')

  const twice = await call('POST', `/opportunities/${sessionId}/checkins`, {
    token: volunteerToken,
    body: { code: opened.body?.code },
  })
  check('the same volunteer cannot check in twice', twice.status === 409, `status ${twice.status}`)

  const attendance = await call('GET', `/opportunities/${sessionId}/checkins`, {
    token: organisationToken,
  })
  check('the organiser sees the attendance list', list(attendance.body).length === 1)

  const bareCheckout = await call('PATCH', `/checkins/${checkedIn.body?.id}/checkout`, {
    token: volunteerToken,
    body: {},
  })
  check('a volunteer cannot check out without the code', bareCheckout.status === 400, `status ${bareCheckout.status}`)

  const freshCode = await call('POST', `/opportunities/${sessionId}/checkin-code`, {
    token: organisationToken,
  })

  const checkedOut = await call('PATCH', `/checkins/${checkedIn.body?.id}/checkout`, {
    token: volunteerToken,
    body: { code: freshCode.body?.code },
  })
  check('checking out records the hours', typeof checkedOut.body?.hours === 'number', JSON.stringify(checkedOut.body))

  const register = await call('GET', `/opportunities/${sessionId}/attendance.csv`, {
    token: organisationToken,
  })
  check('the organiser can export the register', String(register.body?.error ?? register.body).includes('Volunteer'), 'no header row')

  const checkedOutTwice = await call('PATCH', `/checkins/${checkedIn.body?.id}/checkout`, {
    token: volunteerToken,
    body: { code: freshCode.body?.code },
  })
  check('you cannot check out twice', checkedOutTwice.status === 409, `status ${checkedOutTwice.status}`)

  console.log('\nsubmitted hours')
  const badProof = await call('POST', `/opportunities/${sessionId}/submissions`, {
    token: volunteerToken,
    body: { hoursClaimed: 3, proofUrl: 'not-a-link' },
  })
  check('a proof link must be a link', badProof.status === 400, `status ${badProof.status}`)

  const tooMany = await call('POST', `/opportunities/${sessionId}/submissions`, {
    token: volunteerToken,
    body: { hoursClaimed: 40, proofUrl: 'https://example.com/proof.jpg' },
  })
  check('more than a day of hours is refused', tooMany.status === 400, `status ${tooMany.status}`)

  const submitted = await call('POST', `/opportunities/${sessionId}/submissions`, {
    token: volunteerToken,
    body: { hoursClaimed: 3, proofUrl: 'https://example.com/proof.jpg' },
  })
  check('a volunteer can submit hours', submitted.status === 201, JSON.stringify(submitted.body))

  const submittedTwice = await call('POST', `/opportunities/${sessionId}/submissions`, {
    token: volunteerToken,
    body: { hoursClaimed: 2, proofUrl: 'https://example.com/proof.jpg' },
  })
  check('a second claim is refused while one waits', submittedTwice.status === 409, `status ${submittedTwice.status}`)

  const reviewed = await call('PATCH', `/submissions/${submitted.body?.id}/status`, {
    token: organisationToken,
    body: { decision: 'APPROVE' },
  })
  check('the organiser can approve the hours', reviewed.body?.status === 'APPROVED', JSON.stringify(reviewed.body))

  console.log('\nportfolio')
  const profile = await call('GET', '/auth/me', { token: volunteerToken })
  const slug = profile.body?.profile?.portfolioSlug

  const portfolio = await call('GET', '/portfolio/mine', { token: volunteerToken })
  check('the portfolio adds up the hours', portfolio.body?.totals?.hours > 0, JSON.stringify(portfolio.body?.totals))
  check('both the attendance and the claim are credited', list(portfolio.body?.entries).length === 2, `got ${list(portfolio.body?.entries).length}`)
  check('the skills are gathered', list(portfolio.body?.totals?.skills).includes('Teamwork'))

  const publicPage = await call('GET', `/p/${slug}`)
  check('the public portfolio needs no token', publicPage.status === 200, `status ${publicPage.status}`)
  check('it names the volunteer', publicPage.body?.volunteer?.name?.startsWith('Smoke volunteer'))

  const unknownSlug = await call('GET', '/p/nobody-at-all')
  check('an unknown portfolio address is a 404', unknownSlug.status === 404, `status ${unknownSlug.status}`)

  console.log('\nnotifications')
  const organiserFeed = await call('GET', '/notifications', { token: organisationToken })
  check('the organiser was told about an application', list(organiserFeed.body?.items).some(
    entry => entry.type === 'APPLICATION_RECEIVED'), JSON.stringify(organiserFeed.body?.unread))

  const volunteerFeed = await call('GET', '/notifications', { token: volunteerToken })
  const inbox = list(volunteerFeed.body?.items)
  check('the volunteer was told they got a place', inbox.some(
    entry => entry.type === 'APPLICATION_DECIDED'))
  check('the volunteer was told their hours were credited', inbox.some(
    entry => entry.type === 'HOURS_DECIDED'))
  check('unread counts what has not been opened', volunteerFeed.body?.unread === inbox.length)

  const readOne = await call('PATCH', `/notifications/${inbox[0]?.id}/read`, { token: volunteerToken })
  check('reading one drops the count', readOne.body?.unread === inbox.length - 1, `got ${readOne.body?.unread}`)

  const notYours = await call('PATCH', `/notifications/${inbox[0]?.id}/read`, { token: secondToken })
  check('you cannot read someone else notification', notYours.status === 404, `status ${notYours.status}`)

  const readAll = await call('PATCH', '/notifications/read-all', { token: volunteerToken })
  check('marking all read clears the count', readAll.body?.unread === 0, `got ${readAll.body?.unread}`)

  console.log('\nedges')
  const missing = await call('GET', '/opportunities/does-not-exist', { token: volunteerToken })
  check('an unknown opportunity is a 404', missing.status === 404, `status ${missing.status}`)

  const nowhere = await call('GET', '/nowhere', { token: volunteerToken })
  check('an unknown endpoint is a 404', nowhere.status === 404, `status ${nowhere.status}`)

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed === 0 ? 0 : 1)
}

main().catch(error => {
  console.error('\nThe smoke test could not finish:', error.message)
  process.exit(1)
})
