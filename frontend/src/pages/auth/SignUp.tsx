import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../components/Icon'
import { Button, Field } from '../../components/ui'
import { homeFor, useAuth, type SignUpRole } from '../../auth/AuthContext'
import AuthPanel from './AuthPanel'

const MIN_PASSWORD_LENGTH = 8

export default function SignUp() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<SignUpRole>('volunteer')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`)
    }

    // Caught here rather than at the door of an account nobody can sign in to:
    // Fasha sends no email, so a mistyped password is a trip to the admin.
    if (password !== confirm) {
      return setError('The two passwords are not the same.')
    }

    setBusy(true)

    try {
      const user = await signUp({ name, email, password, role })
      navigate(homeFor(user.role))
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not create the account')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthPanel>
      <div className="auth__top">
        <span className="muted">Already part of Fasha?</span>
        <Link to="/signin"><Button>Sign in</Button></Link>
      </div>

      <form className="auth__form" onSubmit={handleSubmit}>
        <h1>Let&rsquo;s get you started</h1>
        <p className="lede" style={{ marginBottom: 26 }}>Choose how you&rsquo;d like to take part.</p>

        <div className="role-grid">
          <button type="button" className="role-card" aria-pressed={role === 'volunteer'}
                  onClick={() => setRole('volunteer')}>
            <span className="role-card__mark" />
            <Icon name="profile" size={19} />
            <strong>Volunteer</strong>
            <span className="muted">Give time &amp; create initiatives</span>
          </button>
          <button type="button" className="role-card" aria-pressed={role === 'organisation'}
                  onClick={() => setRole('organisation')}>
            <span className="role-card__mark" />
            <Icon name="overview" size={19} />
            <strong>Organisation</strong>
            <span className="muted">Organise &amp; manage initiatives</span>
          </button>
        </div>

        <Field id="name" label="Full name" value={name} required autoComplete="name"
               onChange={e => setName(e.target.value)} />
        <Field id="email" label="Email address" type="email" value={email} required
               autoComplete="email" onChange={e => setEmail(e.target.value)} />
        <Field id="password" label="Password" type="password" value={password} required
               autoComplete="new-password" hint={`Use at least ${MIN_PASSWORD_LENGTH} characters.`}
               onChange={e => setPassword(e.target.value)} />
        <Field id="confirm" label="Password again" type="password" value={confirm} required
               autoComplete="new-password"
               error={confirm !== '' && confirm !== password ? 'These do not match yet.' : undefined}
               onChange={e => setConfirm(e.target.value)} />

        {error && <p className="error" role="alert">{error}</p>}

        <Button type="submit" variant="primary" block disabled={busy}>
          {busy
            ? 'Creating your account…'
            : role === 'volunteer' ? 'Create volunteer account' : 'Create organisation account'}
        </Button>
      </form>
    </AuthPanel>
  )
}
