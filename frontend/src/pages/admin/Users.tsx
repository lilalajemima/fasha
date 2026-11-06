import { useState } from 'react'
import { Loaded } from '../../components/Loader'
import { Card, EmptyState, StatusBadge, type Tone } from '../../components/ui'
import { useAuth } from '../../auth/AuthContext'
import { api } from '../../lib/api'
import { longDate, quantity } from '../../lib/format'
import type { UserView } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'
import '../../styles/workspace.css'
import './Admin.css'

const ROLES = [
  { id: '', label: 'Any role' },
  { id: 'VOLUNTEER', label: 'Volunteers' },
  { id: 'ORGANISATION', label: 'Organisations' },
  { id: 'ADMIN', label: 'Admins' },
]

const STATUSES = [
  { id: '', label: 'Any status' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'DEACTIVATED', label: 'Deactivated' },
  { id: 'DELETED', label: 'Deleted' },
]

const LABELS: Record<string, string> = {
  VOLUNTEER: 'Volunteer',
  ORGANISATION: 'Organisation',
  ADMIN: 'Community admin',
}

function toneFor(status: string): Tone {
  if (status === 'ACTIVE') return 'ok'
  if (status === 'DEACTIVATED') return 'warn'

  return 'neutral'
}

function statusLabel(status: string): string {
  if (status === 'ACTIVE') return 'Active'
  if (status === 'DEACTIVATED') return 'Deactivated'

  return 'Deleted'
}

export default function Users() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState('')
  // Shown once, to be read out to the person standing there. It is never stored.
  const [issued, setIssued] = useState<{ name: string; password: string } | null>(null)

  const search = new URLSearchParams()
  if (query.trim() !== '') search.set('q', query.trim())
  if (role !== '') search.set('role', role)
  if (status !== '') search.set('status', status)

  const people = useGet<UserView[]>(`/admin/users${search.toString() ? `?${search}` : ''}`)

  async function run(id: string, work: () => Promise<unknown>) {
    setProblem('')
    setBusy(id)

    try {
      await work()
      people.reload()
    } catch (failure) {
      setProblem(messageFor(failure))
    } finally {
      setBusy('')
    }
  }

  function setAccountStatus(person: UserView, next: 'ACTIVE' | 'DEACTIVATED') {
    run(person.id, () => api.patch(`/admin/users/${person.id}/status`, { status: next }))
  }

  async function resetPassword(person: UserView) {
    setProblem('')
    setIssued(null)
    setBusy(person.id)

    try {
      const result = await api.post<{ temporaryPassword: string }>(
        `/admin/users/${person.id}/password-reset`,
      )

      setIssued({ name: person.name, password: result.temporaryPassword })
      people.reload()
    } catch (failure) {
      setProblem(messageFor(failure))
    } finally {
      setBusy('')
    }
  }

  function remove(person: UserView) {
    const sure = window.confirm(
      `Delete ${person.name}? Their name, email and sign-in are removed. Hours they were ` +
        'credited stay on the registers they belong to. This cannot be undone.',
    )

    if (!sure) return

    run(person.id, () => api.delete(`/admin/users/${person.id}`))
  }

  return (
    <>
      <section className="banner banner--users">
        <h1 className="banner__title">Users</h1>
      </section>

      <div className="toolbar">
        <input
          className="input toolbar__search"
          placeholder="Search by name or email"
          aria-label="Search accounts"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <select
          className="input toolbar__select"
          aria-label="Filter by role"
          value={role}
          onChange={event => setRole(event.target.value)}
        >
          {ROLES.map(option => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
        <select
          className="input toolbar__select"
          aria-label="Filter by status"
          value={status}
          onChange={event => setStatus(event.target.value)}
        >
          {STATUSES.map(option => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </div>

      {problem && <p className="error" role="alert">{problem}</p>}

      {issued && (
        <Card>
          <h2>Temporary password for {issued.name}</h2>
          <p className="muted">
            Read it out now. It is shown once, and they will be asked to replace it as soon as
            they sign in.
          </p>
          <p className="codepanel__code" style={{ fontSize: 34 }}>{issued.password}</p>
          <button className="linkbtn" onClick={() => setIssued(null)}>Hide</button>
        </Card>
      )}

      <Loaded state={people} what="the accounts">
        {rows => {
          if (rows.length === 0) {
            return <EmptyState>No account matches that.</EmptyState>
          }

          return (
            <>
              <p className="toolbar__count" style={{ marginBottom: 10 }}>
                {quantity(rows.length, 'account')}
              </p>

              <table className="data">
                <thead>
                  <tr>
                    <th>Person</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th aria-hidden="true" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(person => {
                    const self = person.id === user?.id
                    const deleted = person.status === 'DELETED'
                    const working = busy === person.id

                    return (
                      <tr key={person.id} className="data__row--plain">
                        <td>
                          <span className="data__title">{person.name}</span>
                          <div className="data__meta">{person.email}</div>
                        </td>
                        <td>{LABELS[person.role] ?? person.role}</td>
                        <td>
                          {longDate(person.createdAt)}
                          {person.deactivatedAt && (
                            <div className="data__meta">
                              Deactivated {longDate(person.deactivatedAt)}
                            </div>
                          )}
                        </td>
                        <td>
                          <StatusBadge tone={toneFor(person.status)}>
                            {statusLabel(person.status)}
                          </StatusBadge>
                          {person.mustChangePassword && (
                            <div className="data__meta">Must change password</div>
                          )}
                        </td>
                        <td className="data__actions">
                          {self ? (
                            <span className="muted">You</span>
                          ) : deleted ? (
                            <span className="muted">Removed</span>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="data__action"
                                disabled={working}
                                onClick={() => resetPassword(person)}
                              >
                                Reset password
                              </button>
                              {person.status === 'ACTIVE' ? (
                                <button
                                  type="button"
                                  className="data__action"
                                  disabled={working}
                                  onClick={() => setAccountStatus(person, 'DEACTIVATED')}
                                >
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="data__action"
                                  disabled={working}
                                  onClick={() => setAccountStatus(person, 'ACTIVE')}
                                >
                                  Restore
                                </button>
                              )}
                              <button
                                type="button"
                                className="data__action data__action--danger"
                                disabled={working}
                                onClick={() => remove(person)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </>
          )
        }}
      </Loaded>
    </>
  )
}
