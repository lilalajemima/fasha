import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Field } from '../../components/ui'
import { api } from '../../lib/api'
import { messageFor } from '../../lib/useGet'
import AuthPanel from './AuthPanel'

/**
 * Fasha sends no email, so there is no link to click. What this does is tell
 * the community admins that somebody is locked out; they issue a temporary
 * password from the user table and hand it over in person.
 *
 * It says the same thing whether or not the address has an account, because a
 * page that said "no such account" would be a way of finding out who has one.
 */
export default function Forgotten() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      await api.post('/account/forgotten', { email })
      setSent(true)
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthPanel>
      <h1 style={{ marginBottom: 26 }}>Forgotten your password?</h1>

      {sent ? (
        <Card>
          <h3>Ask the community admin</h3>
          <p className="muted">
            If <strong>{email}</strong> has an account, the community admins have been told
            you cannot get in. They can issue a temporary password from the user table, which
            you will be asked to replace as soon as you sign in with it.
          </p>
          <p className="muted" style={{ marginBottom: 0 }}>
            Fasha does not send email, so the temporary password is handed over in person at
            the sector office rather than sent to you.
          </p>
        </Card>
      ) : (
        <form onSubmit={submit}>
          <p className="muted" style={{ marginBottom: 18 }}>
            Tell us which account, and the community admins will be asked to issue you a
            temporary password.
          </p>

          <Field
            id="email"
            label="Email address"
            type="email"
            value={email}
            required
            autoComplete="email"
            onChange={event => setEmail(event.target.value)}
          />

          {error && <p className="error" role="alert">{error}</p>}

          <Button type="submit" variant="primary" block disabled={busy}>
            {busy ? 'Sending…' : 'Ask for a new password'}
          </Button>
        </form>
      )}

      <p className="muted" style={{ marginTop: 18 }}>
        <Link to="/signin">← Back to sign in</Link>
        {' · '}
        <Link to="/privacy">Privacy</Link>
      </p>
    </AuthPanel>
  )
}
