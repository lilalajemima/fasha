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

/** Front-end only for now and will be replace by the API and JWT later*/
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setUser(JSON.parse(saved) as User)
  }, [])

  const value = useMemo<AuthValue>(() => ({
    user,
    signUp(next) {
      setUser(next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    },
    signIn(email, role) {
      const next: User = { name: email.split('@')[0], email, role }
      setUser(next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    },
    signOut() {
      setUser(null)
      localStorage.removeItem(STORAGE_KEY)
    },
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
