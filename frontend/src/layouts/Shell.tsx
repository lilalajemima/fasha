import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import HelpButton from '../components/HelpButton'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import MobileNav from '../components/MobileNav'
import { useAuth } from '../auth/AuthContext'
import { useNotifications } from '../notifications/NotificationsContext'
import { ORGANISER_GUIDE } from '../pages/manage/guide'
import { VOLUNTEER_GUIDE } from '../pages/volunteer/guide'
import { MANAGE_NAV, PARTICIPATE_NAV, type NavItem } from './navItems'
import '../styles/workspace.css'
import './Shell.css'

export { MANAGE_NAV, PARTICIPATE_NAV }
export type { NavItem }

function initials(name: string) {
  return name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()
}

function plates(items: NavItem[]) {
  return items.map(item => (
    <NavLink key={item.to} to={item.to} end={item.end} className="navplate">
      <Icon name={item.icon} />
      <span>{item.label}</span>
    </NavLink>
  ))
}

export default function Shell() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const isVolunteer = user?.role !== 'organisation'
  const name = user?.name ?? 'Guest'
  const { unread } = useNotifications()
  // One guide for running opportunities, one for taking part. The shell decides
  // which by where you are, so no page can forget to offer help.
  const inManageWorkspace = useLocation().pathname.startsWith('/manage')

  return (
    <div className="shell">
      <aside className="side">
        <div className="side__brand"><Logo /></div>
        <div className="side__group">Your workspace</div>
        {/* The role, not the name: the name is already in the top bar. */}
        <div className="side__workspace">{isVolunteer ? 'Volunteer' : 'Organiser'}</div>

        {isVolunteer ? (
          <nav className="side__nav" aria-label="Taking part">{plates(PARTICIPATE_NAV)}</nav>
        ) : (
          <nav className="side__nav" aria-label="Managing opportunities">{plates(MANAGE_NAV)}</nav>
        )}

        <div className="side__foot">
          {!isVolunteer && (
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
            <span className="topbar__brand"><Logo size={24} /></span>
          </span>
          <div className="topbar__right">
            <Link to="/notifications" className="bell" aria-label={`Notifications, ${unread} unread`}>
              <Icon name="bell" />
              {unread > 0 && <span className="bell__count">{unread}</span>}
            </Link>
            <span className="topbar__divider" />
            <span className="avatar">
              {user?.avatar ? <img src={user.avatar} alt="" /> : initials(name)}
            </span>
            <span className="topbar__name">{name}</span>
          </div>
        </header>

        <main className="content"><Outlet /></main>

        <HelpButton
          title={inManageWorkspace ? 'Running opportunities' : 'Using Fasha'}
          notes={inManageWorkspace ? ORGANISER_GUIDE : VOLUNTEER_GUIDE}
        />
      </div>
    </div>
  )
}