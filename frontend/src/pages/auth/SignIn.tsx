import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../components/Icon'
import { Button, Field } from '../../components/ui'
import { useAuth, type Role } from '../../auth/AuthContext'
import AuthPanel from './AuthPanel'

export default function SignIn() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('volunteer')
  const [email, setEmail] = useState('amara@example.com')
  const [password, setPassword] = useState('demo1234')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    signIn(email, role)
    navigate(role === 'volunteer' ? '/discover' : '/org')
  }

  return (
    <AuthPanel>
      <div className="auth__top">
        <span className="muted">New to Fasha?</span>
        <Link to="/signup"><Button>Create account</Button></Link>
      </div>

      <form className="auth__form" onSubmit={handleSubmit}>
        <span className="eyebrow">Welcome back</span>
        <h1>Sign in to Fasha</h1>
        <p className="lede" style={{ marginBottom: 26 }}>Pick the workspace you want to open.</p>

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

        <Field id="email" label="Email address" type="email" value={email} required
               onChange={e => setEmail(e.target.value)} />
        <Field id="password" label="Password" type="password" value={password} required
               onChange={e => setPassword(e.target.value)} />

        <Button type="submit" variant="primary" block>Sign in</Button>
      </form>
    </AuthPanel>
  )
}
