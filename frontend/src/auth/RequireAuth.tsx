import { Navigate, Outlet } from 'react-router-dom'
import { homeFor, useAuth } from './AuthContext'

function Checking() {
  return <p className="empty">Checking your session…</p>
}

export default function RequireAuth() {
  const { user, ready } = useAuth()

  if (!ready) return <Checking />
  if (!user) return <Navigate to="/signin" replace />

  return <Outlet />
}

export function RequireVolunteer() {
  const { user, ready } = useAuth()

  if (!ready) return <Checking />
  if (!user) return <Navigate to="/signin" replace />
  if (user.role !== 'volunteer') return <Navigate to={homeFor(user.role)} replace />

  return <Outlet />
}

/**
 * The manage workspace is for organisations. A volunteer running their own
 * initiative gets the same tools inside that initiative, not a second
 * workspace listing everybody's work.
 */
export function RequireOrganisation() {
  const { user, ready } = useAuth()

  if (!ready) return <Checking />
  if (!user) return <Navigate to="/signin" replace />
  if (user.role !== 'organisation') return <Navigate to={homeFor(user.role)} replace />

  return <Outlet />
}

export function RequireAdmin() {
  const { user, ready } = useAuth()

  if (!ready) return <Checking />
  if (!user) return <Navigate to="/signin" replace />
  if (user.role !== 'admin') return <Navigate to={homeFor(user.role)} replace />

  return <Outlet />
}
