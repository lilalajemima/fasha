import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import { messageFor } from '../lib/useGet'
import { Button, Card, Field } from './ui'
import Logo from './Logo'

/**
 * Shown instead of the application when an admin has issued a temporary
 * password. Nothing else is reachable until the person sets their own, so a
 * password that was read out loud cannot stay in use.
 */
export default function PasswordGate() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (next !== confirm) {
      setError('The two new passwords do not match')
      return
    }

    setBusy(true)

    try {
      await api.post('/account/password', { currentPassword: current, newPassword: next })
      // Signing in again is the clearest proof to the person that it worked.
      signOut()
      navigate('/signin')
    } catch (problem) {
      setError(messageFor(problem))
      setBusy(false)
    }
  }

  return (
    <div className="gate">
      <form className="gate__panel" onSubmit={submit}>
        <Logo size={26} />
        <h1 style={{ margin: '18px 0 6px' }}>Set your own password</h1>
        <p className="muted" style={{ marginBottom: 18 }}>
          Your password was reset by the community admin. Choose a new one to carry on.
        </p>

        <Card>
          <Field
            id="current"
            label="Temporary password"
            type="password"
            value={current}
            required
            onChange={event => setCurrent(event.target.value)}
          />
          <Field
            id="next"
            label="New password"
            type="password"
            value={next}
            required
            minLength={8}
            hint="At least 8 characters"
            onChange={event => setNext(event.target.value)}
          />
          <Field
            id="confirm"
            label="New password again"
            type="password"
            value={confirm}
            required
            onChange={event => setConfirm(event.target.value)}
          />

          {error && <p className="error" role="alert">{error}</p>}

          <Button type="submit" variant="primary" block disabled={busy}>
            {busy ? 'Saving…' : 'Save and sign in again'}
          </Button>
        </Card>
      </form>
    </div>
  )
}
