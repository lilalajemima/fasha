import type { User, UserRole, UserStatus } from '@prisma/client'

export type AccountRow = {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  mustChangePassword: boolean
  createdAt: Date
  deactivatedAt: Date | null
}

export type UserFilter = {
  search: string | null
  role: UserRole | null
  status: UserStatus | null
}

export type Anonymised = {
  name: string
  email: string
  passwordHash: string
  portfolioSlug: string
}

export interface AccountStore {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<AccountRow | null>
  findRow(id: string): Promise<AccountRow | null>
  list(filter: UserFilter): Promise<AccountRow[]>
  countActiveAdmins(): Promise<number>
  setPassword(id: string, passwordHash: string, mustChange: boolean): Promise<number>
  setStatus(id: string, status: UserStatus, deactivatedAt: Date | null): Promise<void>
  anonymise(id: string, replacement: Anonymised): Promise<void>
}
