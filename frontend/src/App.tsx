import { lazy, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import RequireAuth, { RequireAdmin, RequireOrganisation, RequireVolunteer } from './auth/RequireAuth'
import DocumentTitle from './components/DocumentTitle'
import PageBoundary from './components/PageBoundary'
import { NotificationsProvider } from './notifications/NotificationsContext'
import { fetchWorkspace, load } from './pages/load'
import Forgotten from './pages/auth/Forgotten'
import SignIn from './pages/auth/SignIn'
import SignUp from './pages/auth/SignUp'
import Privacy from './pages/Privacy'

// The pages above are the ones somebody who is not signed in can reach, so
// they come with the first download. Everything below is fetched the first
// time it is opened, which keeps sign in quick on a phone.
const Shell = lazy(load.shell)
const Notifications = lazy(load.notifications)
const Profile = lazy(load.profile)
const Discover = lazy(load.discover)
const OpportunityDetail = lazy(load.opportunityDetail)
const MyActivity = lazy(load.myActivity)
const MyInitiatives = lazy(load.myInitiatives)
const MyInitiative = lazy(load.myInitiative)
const CreateOpportunity = lazy(load.createOpportunity)
const Portfolio = lazy(load.portfolio)
const CheckIn = lazy(load.checkIn)
const Overview = lazy(load.manageOverview)
const Opportunities = lazy(load.opportunities)
const Applicants = lazy(load.applicants)
const Deliverables = lazy(load.deliverables)
const Attendance = lazy(load.attendance)
const AdminOverview = lazy(load.adminOverview)
const Approvals = lazy(load.approvals)
const Users = lazy(load.users)
const AdminActivity = lazy(load.adminActivity)

// Once somebody is signed in, fetch the rest of their workspace while they
// read the first page, when the browser has nothing better to do.
function FetchWorkspace() {
  const { user } = useAuth()
  const role = user?.role ?? null

  useEffect(() => {
    if (!role) return

    const start = () => fetchWorkspace(role)

    // Safari has no idle callback yet, so it waits a moment instead.
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(start, { timeout: 4_000 })

      return () => window.cancelIdleCallback(id)
    }

    const timer = window.setTimeout(start, 1_500)

    return () => window.clearTimeout(timer)
  }, [role])

  return null
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <DocumentTitle />
        <FetchWorkspace />
        <PageBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/discover" replace />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/forgotten" element={<Forgotten />} />
            <Route path="/p/:slug" element={<Portfolio />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* Taking part, plus running your own initiative from inside it. */}
            <Route element={<RequireVolunteer />}>
              <Route element={<Shell />}>
                <Route path="/discover" element={<Discover />} />
                <Route path="/opportunities/:id" element={<OpportunityDetail />} />
                <Route path="/activity" element={<MyActivity />} />
                <Route path="/initiatives" element={<MyInitiatives />} />
                <Route path="/initiatives/new" element={<CreateOpportunity />} />
                <Route path="/initiatives/:id/edit" element={<CreateOpportunity />} />
                <Route path="/initiatives/:id" element={<MyInitiative tab="details" />} />
                <Route
                  path="/initiatives/:id/applicants"
                  element={<MyInitiative tab="applicants" />}
                />
                <Route
                  path="/initiatives/:id/attendance"
                  element={<MyInitiative tab="attendance" />}
                />
                <Route
                  path="/initiatives/:id/deliverables"
                  element={<MyInitiative tab="deliverables" />}
                />
                {/* Inside the shell now that it is a place in the sidebar. The
                    public copy at /p/:slug is the same page without it. */}
                <Route path="/portfolio" element={<Portfolio />} />
              </Route>
              <Route path="/check-in" element={<CheckIn />} />
            </Route>

            {/* Oversight belongs to the community admin only: one page per job,
                inside the same shell as the other two workspaces. */}
            <Route element={<RequireAdmin />}>
              <Route element={<Shell />}>
                <Route path="/admin" element={<AdminOverview />} />
                <Route path="/admin/approvals" element={<Approvals />} />
                <Route path="/admin/users" element={<Users />} />
                <Route path="/admin/activity" element={<AdminActivity />} />
              </Route>
            </Route>

            {/* The manage workspace belongs to organisations only. */}
            <Route element={<RequireOrganisation />}>
              <Route element={<Shell />}>
                <Route path="/manage" element={<Overview />} />
                <Route path="/manage/opportunities" element={<Opportunities />} />
                <Route path="/manage/opportunities/new" element={<CreateOpportunity />} />
                <Route path="/manage/opportunities/:id/edit" element={<CreateOpportunity />} />
                <Route path="/manage/opportunities/:id/applications" element={<Applicants />} />
                <Route path="/manage/review" element={<Deliverables />} />
                <Route path="/manage/attendance" element={<Attendance />} />
              </Route>
            </Route>

            {/* Everyone signed in gets their notifications and their profile. */}
            <Route element={<RequireAuth />}>
              <Route element={<Shell />}>
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/discover" replace />} />
          </Routes>
        </PageBoundary>
      </NotificationsProvider>
    </AuthProvider>
  )
}
