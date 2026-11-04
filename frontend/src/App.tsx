import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import RequireAuth, { RequireAdmin, RequireOrganisation, RequireVolunteer } from './auth/RequireAuth'
import DocumentTitle from './components/DocumentTitle'
import Shell from './layouts/Shell'
import { NotificationsProvider } from './notifications/NotificationsContext'
import Notifications from './pages/Notifications'
import AdminDashboard from './pages/admin/AdminDashboard'
import SignIn from './pages/auth/SignIn'
import SignUp from './pages/auth/SignUp'
import Applicants from './pages/manage/Applicants'
import Attendance from './pages/manage/Attendance'
import Deliverables from './pages/manage/Deliverables'
import Opportunities from './pages/manage/Opportunities'
import Overview from './pages/manage/Overview'
import CheckIn from './pages/volunteer/CheckIn'
import CreateOpportunity from './pages/volunteer/CreateOpportunity'
import Discover from './pages/volunteer/Discover'
import MyActivity from './pages/volunteer/MyActivity'
import MyInitiative from './pages/volunteer/MyInitiative'
import MyInitiatives from './pages/volunteer/MyInitiatives'
import OpportunityDetail from './pages/volunteer/OpportunityDetail'
import Portfolio from './pages/volunteer/Portfolio'
import Profile from './pages/volunteer/Profile'

export default function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <DocumentTitle />
        <Routes>
          <Route path="/" element={<Navigate to="/discover" replace />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/p/:slug" element={<Portfolio />} />

          {/* Taking part, plus running your own initiative from inside it. */}
          <Route element={<RequireVolunteer />}>
            <Route element={<Shell />}>
              <Route path="/discover" element={<Discover />} />
              <Route path="/opportunities/:id" element={<OpportunityDetail />} />
              <Route path="/activity" element={<MyActivity />} />
              <Route path="/profile" element={<Profile />} />
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
            </Route>
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/check-in" element={<CheckIn />} />
          </Route>

          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminDashboard />} />
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

          {/* Everyone signed in gets their notifications. */}
          <Route element={<RequireAuth />}>
            <Route element={<Shell />}>
              <Route path="/notifications" element={<Notifications />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/discover" replace />} />
        </Routes>
      </NotificationsProvider>
    </AuthProvider>
  )
}
