import type { User, UserRole, UserStatus } from '@prisma/client'

/** One account as the user management table shows it. */
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

/**
 * What a deleted account is replaced with. The row survives so that other
 * people's registers and credited hours keep their shape; the identity and the
 * way back in do not.
 */
export type Anonymised = {
  name: string
  email: string
  passwordHash: string
  portfolioSlug: string
}

export interface AccountStore {
  findById(id: string): Promise<User | null>
  /** Used by the forgotten-password request, which must not say who exists. */
  findByEmail(email: string): Promise<AccountRow | null>
  findRow(id: string): Promise<AccountRow | null>
  list(filter: UserFilter): Promise<AccountRow[]>
  /** Used to refuse the change that would leave the platform unadministered. */
  countActiveAdmins(): Promise<number>
  setPassword(id: string, passwordHash: string, mustChange: boolean): Promise<void>
  setStatus(id: string, status: UserStatus, deactivatedAt: Date | null): Promise<void>
  anonymise(id: string, replacement: Anonymised): Promise<void>
}
