import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import RequireAuth, { RequireVolunteer } from './auth/RequireAuth'
import Shell from './layouts/Shell'
import SignIn from './pages/auth/SignIn'
import SignUp from './pages/auth/SignUp'
import Attendance from './pages/manage/Attendance'
import Opportunities from './pages/manage/Opportunities'
import Overview from './pages/manage/Overview'
import ReviewWorkspace from './pages/manage/ReviewWorkspace'
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

        {/* Taking part: volunteer accounts only */}
        <Route element={<RequireVolunteer />}>
          <Route element={<Shell />}>
            <Route path="/discover" element={<Discover />} />
            <Route path="/opportunities/:id" element={<OpportunityDetail />} />
            <Route path="/activity" element={<MyActivity />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/initiatives" element={<MyInitiatives />} />
            <Route path="/initiatives/new" element={<CreateOpportunity />} />
          </Route>
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/check-in" element={<CheckIn />} />
        </Route>

        {/* Managing opportunities: both account types */}
        <Route element={<RequireAuth />}>
          <Route element={<Shell />}>
            <Route path="/manage" element={<Overview />} />
            <Route path="/manage/opportunities" element={<Opportunities />} />
            <Route path="/manage/opportunities/new" element={<CreateOpportunity />} />
            <Route path="/manage/review" element={<ReviewWorkspace />} />
            <Route path="/manage/attendance" element={<Attendance />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/discover" replace />} />
      </Routes>
    </AuthProvider>
  )
}
