import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import MobileNav from '../components/MobileNav'
import { useAuth } from '../auth/AuthContext'
import { MANAGE_NAV, PARTICIPATE_NAV, type NavItem } from './navItems'
import './Shell.css'

export { MANAGE_NAV, PARTICIPATE_NAV }
export type { NavItem }

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

export default function Shell() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
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

        <div className="side__foot">
          {isVolunteer ? (
            <span>Small actions. Shared impact.</span>
          ) : (
            <button className="navplate navplate--danger"
                    onClick={() => { signOut(); navigate('/signin') }}>
              <Icon name="signout" /> <span>Sign out</span>
            </button>
          )}
        </div>
      </aside>

      <div>
        <header className="topbar">
          <span className="topbar__left">
            <MobileNav />
            <Logo size={24} />
          </span>
          <div className="topbar__right">
            <Link to="/notifications" className="bell" aria-label="Notifications">
              <Icon name="bell" />
            </Link>
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
