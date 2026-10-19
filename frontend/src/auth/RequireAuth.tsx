import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

/**
 * Management screens are open to any signed-in account. A volunteer may organise
 * as well as take part, so both roles reach these routes.
 */
export default function RequireAuth() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/signin" replace />
  return <Outlet />
}

/**
 * Participation is the part an organisation account may not do. Applying,
 * checking in, submitting a deliverable and holding a portfolio are volunteer
 * only, and the rule is enforced here rather than by hiding buttons.
 */
export function RequireVolunteer() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/signin" replace />
  if (user.role !== 'volunteer') return <Navigate to="/manage" replace />
  return <Outlet />
}
