import type { Role } from '../auth/AuthContext'

export type DemoAccount = { email: string; password: string }

const volunteerEmail = import.meta.env.VITE_DEMO_VOLUNTEER_EMAIL
const organisationEmail = import.meta.env.VITE_DEMO_ORGANISATION_EMAIL
const password = import.meta.env.VITE_DEMO_PASSWORD

export const demoAccounts: Record<Role, DemoAccount> | null =
  volunteerEmail && organisationEmail && password
    ? {
        volunteer: { email: volunteerEmail, password },
        organisation: { email: organisationEmail, password },
      }
    : null
