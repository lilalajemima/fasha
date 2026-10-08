import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import RequireAuth from './auth/RequireAuth'
import OrgShell from './layouts/OrgShell'
import VolunteerShell from './layouts/VolunteerShell'
import SignIn from './pages/auth/SignIn'
import SignUp from './pages/auth/SignUp'
import Attendance from './pages/org/Attendance'
import Opportunities from './pages/org/Opportunities'
import Overview from './pages/org/Overview'
import ReviewWorkspace from './pages/org/ReviewWorkspace'
import CheckIn from './pages/volunteer/CheckIn'
import CreateOpportunity from './pages/volunteer/CreateOpportunity'
import Discover from './pages/volunteer/Discover'
import MyActivity from './pages/volunteer/MyActivity'
import MyInitiatives from './pages/volunteer/MyInitiatives'
import OpportunityDetail from './pages/volunteer/OpportunityDetail'
import Portfolio from './pages/volunteer/Portfolio'
import Profile from './pages/volunteer/Profile'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/discover" replace />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/p/:slug" element={<Portfolio />} />

        <Route element={<RequireAuth role="volunteer" />}>
          <Route element={<VolunteerShell />}>
            <Route path="/discover" element={<Discover />} />
            <Route path="/opportunities/:id" element={<OpportunityDetail />} />
            <Route path="/activity" element={<MyActivity />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/initiatives" element={<MyInitiatives />} />
            <Route path="/initiatives/new" element={<CreateOpportunity />} />
          </Route>
          <Route path="/check-in" element={<CheckIn />} />
        </Route>

        <Route element={<RequireAuth role="organisation" />}>
          <Route element={<OrgShell />}>
            <Route path="/org" element={<Overview />} />
            <Route path="/org/opportunities" element={<Opportunities />} />
            <Route path="/org/opportunities/new" element={<CreateOpportunity />} />
            <Route path="/org/review" element={<ReviewWorkspace />} />
            <Route path="/org/attendance" element={<Attendance />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/discover" replace />} />
      </Routes>
    </AuthProvider>
  )
}
