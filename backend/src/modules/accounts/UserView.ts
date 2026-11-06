import type { AccountRow } from './AccountStore'

export type UserView = {
  id: string
  name: string
  email: string
  role: string
  status: string
  mustChangePassword: boolean
  createdAt: string
  deactivatedAt: string | null
}

export function toUserView(row: AccountRow): UserView {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    mustChangePassword: row.mustChangePassword,
    createdAt: row.createdAt.toISOString(),
    deactivatedAt: row.deactivatedAt ? row.deactivatedAt.toISOString() : null,
  }
}
