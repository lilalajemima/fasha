import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, type Role } from './AuthContext'

/**
 * Keeps the two account types apart at the route level rather than by hiding
 * buttons: only a volunteer account can reach the participant screens.
 */
export default function RequireAuth({ role }: { role: Role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/signin" replace />
  if (user.role !== role) return <Navigate to={user.role === 'volunteer' ? '/discover' : '/org'} replace />
  return <Outlet />
}
