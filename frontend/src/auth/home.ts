import type { Role } from './AuthContext'

// Where each kind of account lands after signing in.
export function homeFor(role: Role): string {
  if (role === 'admin') return '/admin'
  if (role === 'organisation') return '/manage'

  return '/discover'
}
