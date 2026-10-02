import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, type Role } from './AuthContext'

/** Keeps each workspace to its own role: only volunteers may take part. */
export default function RequireAuth({ role }: { role: Role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/signin" replace />
  if (user.role !== role) return <Navigate to={user.role === 'volunteer' ? '/discover' : '/org'} replace />
  return <Outlet />
}
