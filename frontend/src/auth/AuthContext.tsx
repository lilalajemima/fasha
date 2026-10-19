import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Role = 'volunteer' | 'organisation'
export type User = { name: string; email: string; role: Role }

type AuthValue = {
  user: User | null
  signUp: (user: User) => void
  signIn: (email: string, role: Role) => void
  signOut: () => void
}

const STORAGE_KEY = 'fasha.user'
const AuthContext = createContext<AuthValue | null>(null)

const DEMO_NAME: Record<Role, string> = {
  volunteer: 'Amara Mensah',
  organisation: 'Green Neighbourhood',
}

/** Front end only. Replaced by the API and JWT in the integration sprint. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setUser(JSON.parse(saved) as User)
  }, [])

  function persist(next: User | null) {
    setUser(next)
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
  }

  const value = useMemo<AuthValue>(() => ({
    user,
    signUp: next => persist(next),
    signIn: (email, role) => persist({ name: DEMO_NAME[role], email, role }),
    signOut: () => persist(null),
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
