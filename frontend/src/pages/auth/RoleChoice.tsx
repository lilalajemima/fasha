import Icon from '../../components/Icon'
import type { SignUpRole } from '../../auth/AuthContext'

export default function RoleChoice({ value, onChange }: {
  value: SignUpRole
  onChange: (role: SignUpRole) => void
}) {
  return (
    <div className="role-grid">
      <button type="button" className="role-card" aria-pressed={value === 'volunteer'}
              onClick={() => onChange('volunteer')}>
        <span className="role-card__mark" />
        <Icon name="profile" size={19} />
        <strong>Volunteer</strong>
        <span className="muted">Give time &amp; create initiatives</span>
      </button>
      <button type="button" className="role-card" aria-pressed={value === 'organisation'}
              onClick={() => onChange('organisation')}>
        <span className="role-card__mark" />
        <Icon name="overview" size={19} />
        <strong>Organisation</strong>
        <span className="muted">Organise &amp; manage initiatives</span>
      </button>
    </div>
  )
}
