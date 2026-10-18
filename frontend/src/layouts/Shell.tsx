import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Icon, { type IconName } from '../components/Icon'
import Logo from '../components/Logo'
import { useAuth, type Role } from '../auth/AuthContext'
import './Shell.css'

export type NavItem = { to: string; label: string; short: string; icon: IconName; end?: boolean }

export const VOLUNTEER_NAV: NavItem[] = [
  { to: '/discover', label: 'Discover', short: 'Discover', icon: 'discover' },
  { to: '/activity', label: 'My activity', short: 'Activity', icon: 'activity' },
  { to: '/portfolio', label: 'My portfolio', short: 'Portfolio', icon: 'portfolio' },
  { to: '/profile', label: 'My profile', short: 'Profile', icon: 'profile' },
  { to: '/initiatives', label: 'My initiatives', short: 'Initiatives', icon: 'initiatives', end: true },
]

export const ORG_NAV: NavItem[] = [
  { to: '/org', label: 'Overview', short: 'Overview', icon: 'overview', end: true },
  { to: '/org/opportunities', label: 'Opportunities', short: 'Opportunities', icon: 'opportunities', end: true },
  { to: '/org/review', label: 'Review workspace', short: 'Review', icon: 'review' },
  { to: '/org/attendance', label: 'Attendance', short: 'Attendance', icon: 'attendance' },
]

function initials(name: string) {
  return name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()
}

/**
 * One shell serves both workspaces. Both navigation groups are listed, and
 * following a link into the other workspace switches the signed-in role, which
 * keeps the route guard honest while the backend is still mocked.
 */
export default function Shell({ workspace, role }: { workspace: string; role: Role }) {
  const { user, switchRole } = useAuth()
  const navigate = useNavigate()
  const name = user?.name ?? 'Guest'
  const otherRole: Role = role === 'volunteer' ? 'organisation' : 'volunteer'
  const own = role === 'volunteer' ? VOLUNTEER_NAV : ORG_NAV
  const other = role === 'volunteer' ? ORG_NAV : VOLUNTEER_NAV

  function crossTo(to: string) {
    switchRole(otherRole)
    navigate(to)
  }

  const plates = (items: NavItem[], compact = false) => items.map(item => (
    <NavLink key={item.to} to={item.to} end={item.end} className="navplate">
      <Icon name={item.icon} />
      <span>{compact ? item.short : item.label}</span>
    </NavLink>
  ))

  const crossPlates = (items: NavItem[]) => items.map(item => (
    <button key={item.to} type="button" className="navplate" onClick={() => crossTo(item.to)}>
      <Icon name={item.icon} />
      <span>{item.label}</span>
    </button>
  ))

  return (
    <div className="shell">
      <aside className="side">
        <div className="side__brand"><Logo /></div>
        <div className="side__group">Your workspace</div>
        <div className="side__workspace">{workspace}</div>
        <nav className="side__nav" aria-label={`${workspace} navigation`}>{plates(own)}</nav>
        <hr className="side__rule" />
        <nav className="side__nav" aria-label="Other workspace">{crossPlates(other)}</nav>
        <div className="side__foot">Small actions. Shared impact.</div>
      </aside>

      <div>
        <header className="topbar">
          <Logo size={24} />
          <div className="topbar__right">
            <span className="bell"><Icon name="bell" /><span className="bell__count">3</span></span>
            <span className="topbar__divider" />
            <span className="avatar">{initials(name)}</span>
            <span className="topbar__name">{name}</span>
          </div>
        </header>

        <nav className="railnav" aria-label="Sections">{plates(own, true)}</nav>

        <main className="content"><Outlet /></main>
      </div>
    </div>
  )
}
