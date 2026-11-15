import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, tokenStore } from '../lib/api'
import { clearCache } from '../lib/cache'
import { clearDrafts } from '../lib/useDraft'
import { forgetGoogleChoice } from '../lib/google'

export type Role = 'volunteer' | 'organisation' | 'admin'
export type SignUpRole = 'volunteer' | 'organisation'
export type User = {
  id: string
  name: string
  email: string
  role: Role
  mustChangePassword: boolean
  avatar: string | null
  /** False for somebody who has only ever signed in with Google. */
  hasPassword: boolean
}

type ServerRole = 'VOLUNTEER' | 'ORGANISATION' | 'ADMIN'
type ServerUser = {
  id: string
  name: string
  email: string
  role: ServerRole
  mustChangePassword: boolean
  avatar: string | null
  hasPassword: boolean
}
type AuthResponse = { token: string; user: ServerUser }

/** Google knows who this is, but Fasha needs to know how they'll take part. */
export type NewToFasha = { chooseRole: { name: string; email: string } }
type GoogleResponse = AuthResponse | NewToFasha

type SignUpInput = { name: string; email: string; password: string; role: SignUpRole }

type AuthValue = {
  user: User | null
  ready: boolean
  signUp: (input: SignUpInput) => Promise<User>
  signIn: (email: string, password: string) => Promise<User>
  /** Signs in, or joins when a role is given. Without one, a newcomer gets asked. */
  signInWithGoogle: (credential: string, role?: SignUpRole) => Promise<User | NewToFasha>
  signOut: () => void
  /** Keeps the session alive after a password change, which issues a new token. */
  replaceToken: (token: string) => void
  /** Re-reads the account, so a new name or picture reaches the top bar. */
  refresh: () => void
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
      clearCache()
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
      async signInWithGoogle(credential, role) {
        const result = await api.post<GoogleResponse>('/auth/google', {
          credential,
          ...(role ? { role: toServerRole(role) } : {}),
        })

        return 'chooseRole' in result ? result : accept(result)
      },
      signOut() {
        forgetGoogleChoice()
        tokenStore.clear()
        clearDrafts()
        clearCache()
        setUser(null)
      },
      replaceToken(token) {
        tokenStore.save(token)
      },
      refresh() {
        if (!tokenStore.read()) return

        api
          .get<{ user: ServerUser }>('/auth/me')
          .then(({ user: me }) => setUser(toUser(me)))
          .catch(() => undefined)
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