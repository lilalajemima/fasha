import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

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
  if (user.role !== 'volunteer') return <Navigate to="/manage" replace />
  return <Outlet />
}
