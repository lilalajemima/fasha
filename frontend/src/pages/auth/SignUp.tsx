import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../components/Icon'
import { Button, Field } from '../../components/ui'
import { useAuth, type Role } from '../../auth/AuthContext'
import AuthPanel from './AuthPanel'

export default function SignUp() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('volunteer')
  const [name, setName] = useState('Amara Mensah')
  const [email, setEmail] = useState('amara@example.com')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(true)
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (!agreed) return setError('Please accept the terms to continue.')
    signUp({ name, email, role })
    navigate(role === 'volunteer' ? '/discover' : '/org')
  }

  return (
    <AuthPanel>
      <div className="auth__top">
        <span className="muted">Already part of Fasha?</span>
        <Link to="/signin"><Button>Sign in</Button></Link>
      </div>

      <form className="auth__form" onSubmit={handleSubmit}>
        <span className="eyebrow">Welcome to Fasha</span>
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

        <Field id="name" label="Full name" value={name} required
               onChange={e => setName(e.target.value)} />
        <Field id="email" label="Email address" type="email" value={email} required
               onChange={e => setEmail(e.target.value)} />
        <Field id="password" label="Password" type="password" value={password} required
               hint="Use at least 8 characters." onChange={e => setPassword(e.target.value)} />

        <label className="field" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
          <span>I agree to the Terms of service and Privacy policy.</span>
        </label>

        {error && <p className="error">{error}</p>}

        <Button type="submit" variant="primary" block>
          {role === 'volunteer' ? 'Create volunteer account' : 'Create organisation account'}
        </Button>

        <hr />
        <p className="muted" style={{ marginBottom: 0 }}>
          Volunteers can join or create opportunities. Organisations create and manage
          opportunities, without participant actions.
        </p>
      </form>
    </AuthPanel>
  )
}
