import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, tokenStore } from '../lib/api'

export type Role = 'volunteer' | 'organisation' | 'admin'
export type SignUpRole = 'volunteer' | 'organisation'
export type User = {
  id: string
  name: string
  email: string
  role: Role
  mustChangePassword: boolean
  avatar: string | null
}

type ServerRole = 'VOLUNTEER' | 'ORGANISATION' | 'ADMIN'
type ServerUser = {
  id: string
  name: string
  email: string
  role: ServerRole
  mustChangePassword: boolean
  avatar: string | null
}
type AuthResponse = { token: string; user: ServerUser }

type SignUpInput = { name: string; email: string; password: string; role: SignUpRole }

type AuthValue = {
  user: User | null
  ready: boolean
  signUp: (input: SignUpInput) => Promise<User>
  signIn: (email: string, password: string) => Promise<User>
  signOut: () => void
  refresh: () => void
  // Changing the password ends every session the account had, this one
  // included. The server answers with a replacement so the device that made
  // the change carries on; everywhere else is signed out on its next request.
  replaceToken: (token: string) => void
}

const ROLES: Record<ServerRole, Role> = {
  VOLUNTEER: 'volunteer',
  ORGANISATION: 'organisation',
  ADMIN: 'admin',
}

function toUser(user: ServerUser): User {
  return { ...user, role: ROLES[user.role] ?? 'volunteer' }
}

function toServerRole(role: SignUpRole): ServerRole {
  return role === 'organisation' ? 'ORGANISATION' : 'VOLUNTEER'
}

export function homeFor(role: Role): string {
  if (role === 'admin') return '/admin'
  if (role === 'organisation') return '/manage'

  return '/discover'
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(() => tokenStore.read() === null)

  useEffect(() => {
    if (!tokenStore.read()) return

    api
      .get<{ user: ServerUser }>('/auth/me')
      .then(({ user: me }) => setUser(toUser(me)))
      .catch(() => tokenStore.clear())
      .finally(() => setReady(true))
  }, [])

  const value = useMemo<AuthValue>(() => {
    function accept(result: AuthResponse): User {
      tokenStore.save(result.token)
      const next = toUser(result.user)
      setUser(next)
      return next
    }

    return {
      user,
      ready,
      async signUp(input) {
        return accept(await api.post<AuthResponse>('/auth/register', {
          ...input,
          role: toServerRole(input.role),
        }))
      },
      async signIn(email, password) {
        return accept(await api.post<AuthResponse>('/auth/login', { email, password }))
      },
      signOut() {
        tokenStore.clear()
        setUser(null)
      },
      refresh() {
        if (!tokenStore.read()) return

        api
          .get<{ user: ServerUser }>('/auth/me')
          .then(({ user: me }) => setUser(toUser(me)))
          .catch(() => undefined)
      },
      replaceToken(token) {
        tokenStore.save(token)
      },
    }
  }, [user, ready])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
