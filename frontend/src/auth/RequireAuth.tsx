import { Navigate, Outlet } from 'react-router-dom'
import PasswordGate from '../components/PasswordGate'
import { homeFor, useAuth, type Role } from './AuthContext'

function Checking() {
  return <p className="empty">Checking your session…</p>
}

/**
 * One gate for every protected route, so a rule cannot be added to three of
 * them and forgotten on the fourth. A temporary password gets you in and no
 * further: until it is replaced, the only thing on screen is the form that
 * replaces it.
 */
function guard(role: Role | null) {
  return function Guarded() {
    const { user, ready } = useAuth()

    if (!ready) return <Checking />
    if (!user) return <Navigate to="/signin" replace />
    if (user.mustChangePassword) return <PasswordGate />
    if (role && user.role !== role) return <Navigate to={homeFor(user.role)} replace />

    return <Outlet />
  }
}

export default guard(null)

export const RequireVolunteer = guard('volunteer')

// The manage workspace is for organisations. A volunteer running their own
// initiative gets the same tools inside that initiative, not a second
// workspace listing everybody's work.
export const RequireOrganisation = guard('organisation')

export const RequireAdmin = guard('admin')
