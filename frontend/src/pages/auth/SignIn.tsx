import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../components/Icon'
import { Button, Card, Field } from '../../components/ui'
import { homeFor, useAuth, type SignUpRole } from '../../auth/AuthContext'
import { demoAccounts } from '../../lib/demo'
import AuthPanel from './AuthPanel'

export default function SignIn() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<SignUpRole>('volunteer')
  const [email, setEmail] = useState(demoAccounts?.volunteer.email ?? '')
  const [password, setPassword] = useState(demoAccounts?.volunteer.password ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function choose(next: SignUpRole) {
    if (!demoAccounts) return

    setRole(next)
    setEmail(demoAccounts[next].email)
    setPassword(demoAccounts[next].password)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      const user = await signIn(email, password)
      navigate(homeFor(user.role))
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not sign in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthPanel>
      <div className="auth__top">
        <span className="muted">New to Fasha?</span>
        <Link to="/signup"><Button>Create account</Button></Link>
      </div>

      <form className="auth__form" onSubmit={handleSubmit}>
        <h1 style={{ marginBottom: 26 }}>Sign in to Fasha</h1>

        {demoAccounts && (
          <div className="role-grid">
            <button type="button" className="role-card" aria-pressed={role === 'volunteer'}
                    onClick={() => choose('volunteer')}>
              <span className="role-card__mark" />
              <Icon name="profile" size={19} />
              <strong>Volunteer</strong>
              <span className="muted">Give time &amp; create initiatives</span>
            </button>
            <button type="button" className="role-card" aria-pressed={role === 'organisation'}
                    onClick={() => choose('organisation')}>
              <span className="role-card__mark" />
              <Icon name="overview" size={19} />
              <strong>Organisation</strong>
              <span className="muted">Organise &amp; manage initiatives</span>
            </button>
          </div>
        )}

        <Field id="email" label="Email address" type="email" value={email} required
               autoComplete="email" onChange={e => setEmail(e.target.value)} />
        <Field id="password" label="Password" type="password" value={password} required
               autoComplete="current-password" onChange={e => setPassword(e.target.value)} />

        {error && <p className="error" role="alert">{error}</p>}

        <Button type="submit" variant="primary" block disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>

        {demoAccounts && (
          <div style={{ marginTop: 22 }}>
            <Card variant="note">
              <h3>Demo accounts</h3>
              <p className="muted" style={{ marginBottom: 10 }}>
                Choosing an account type above fills these in.
              </p>
              <div className="muted">
                Volunteer · {demoAccounts.volunteer.email}<br />
                Organisation · {demoAccounts.organisation.email}
              </div>
            </Card>
          </div>
        )}
      </form>
    </AuthPanel>
  )
}
