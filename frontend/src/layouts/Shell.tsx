import { NavLink, Outlet } from 'react-router-dom'
import Icon, { type IconName } from '../components/Icon'
import Logo from '../components/Logo'
import { useAuth } from '../auth/AuthContext'
import './Shell.css'

export type NavItem = { to: string; label: string; short: string; icon: IconName; end?: boolean }

// Taking part. Volunteer accounts only
export const PARTICIPATE_NAV: NavItem[] = [
  { to: '/discover', label: 'Discover', short: 'Discover', icon: 'discover' },
  { to: '/activity', label: 'My activity', short: 'Activity', icon: 'activity' },
  { to: '/portfolio', label: 'My portfolio', short: 'Portfolio', icon: 'portfolio' },
  { to: '/profile', label: 'My profile', short: 'Profile', icon: 'profile' },
  { to: '/initiatives', label: 'My initiatives', short: 'Initiatives', icon: 'initiatives', end: true },
]

// Running opportunities is for both account types
export const MANAGE_NAV: NavItem[] = [
  { to: '/manage', label: 'Overview', short: 'Overview', icon: 'overview', end: true },
  { to: '/manage/opportunities', label: 'Opportunities', short: 'Opportunities', icon: 'opportunities', end: true },
  { to: '/manage/review', label: 'Review workspace', short: 'Review', icon: 'review' },
  { to: '/manage/attendance', label: 'Attendance', short: 'Attendance', icon: 'attendance' },
]

function initials(name: string) {
  return name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()
}

function plates(items: NavItem[], compact = false) {
  return items.map(item => (
    <NavLink key={item.to} to={item.to} end={item.end} className="navplate">
      <Icon name={item.icon} />
      <span>{compact ? item.short : item.label}</span>
    </NavLink>
  ))
}

/*
 One shell for the whole app. A volunteer sees both navigation groups, because
 a volunteer can organise as well as take part. An organisation sees only the
 management group, which is the asymmetry the sidebar divider expresses.
 */ 
export default function Shell() {
  const { user } = useAuth()
  const isVolunteer = user?.role !== 'organisation'
  const name = user?.name ?? 'Guest'
  const workspace = isVolunteer ? 'Volunteer' : name
  const railItems = isVolunteer ? PARTICIPATE_NAV : MANAGE_NAV

  return (
    <div className="shell">
      <aside className="side">
        <div className="side__brand"><Logo /></div>
        <div className="side__group">Your workspace</div>
        <div className="side__workspace">{workspace}</div>

        {isVolunteer && (
          <>
            <nav className="side__nav" aria-label="Taking part">{plates(PARTICIPATE_NAV)}</nav>
            <hr className="side__rule" />
          </>
        )}
        <nav className="side__nav" aria-label="Managing opportunities">{plates(MANAGE_NAV)}</nav>

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

        <nav className="railnav" aria-label="Sections">{plates(railItems, true)}</nav>

        <main className="content"><Outlet /></main>
      </div>
    </div>
  )
}
