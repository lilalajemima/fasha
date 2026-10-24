import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, tokenStore } from '../lib/api'

export type Role = 'volunteer' | 'organisation'
export type User = { id: string; name: string; email: string; role: Role }

type ServerRole = 'VOLUNTEER' | 'ORGANISATION'
type ServerUser = { id: string; name: string; email: string; role: ServerRole }
type AuthResponse = { token: string; user: ServerUser }

type SignUpInput = { name: string; email: string; password: string; role: Role }

type AuthValue = {
  user: User | null
  ready: boolean
  signUp: (input: SignUpInput) => Promise<User>
  signIn: (email: string, password: string) => Promise<User>
  signOut: () => void
}

function toUser(user: ServerUser): User {
  return { ...user, role: user.role === 'ORGANISATION' ? 'organisation' : 'volunteer' }
}

function toServerRole(role: Role): ServerRole {
  return role === 'organisation' ? 'ORGANISATION' : 'VOLUNTEER'
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!tokenStore.read()) {
      setReady(true)
      return
    }

    api.get<{ user: ServerUser }>('/auth/me')
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
    }
  }, [user, ready])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
