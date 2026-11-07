import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import HelpButton, { type HelpNote } from '../components/HelpButton'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import MobileNav from '../components/MobileNav'
import { useAuth, type Role } from '../auth/AuthContext'
import { useNotifications } from '../notifications/NotificationsContext'
import { OVERSIGHT_GUIDE } from '../pages/admin/guide'
import { ORGANISER_GUIDE } from '../pages/manage/guide'
import { VOLUNTEER_GUIDE } from '../pages/volunteer/guide'
import {
  MANAGE_NAV,
  OVERSIGHT_NAV,
  PARTICIPATE_NAV,
  WORKSPACE_LABEL,
  WORKSPACE_NAV,
  workspaceFor,
  type NavItem,
} from './navItems'
import '../styles/workspace.css'
import './Shell.css'

export { MANAGE_NAV, OVERSIGHT_NAV, PARTICIPATE_NAV }
export type { NavItem }

const GUIDES: Record<Role, { title: string; notes: HelpNote[] }> = {
  volunteer: { title: 'Using Fasha', notes: VOLUNTEER_GUIDE },
  organisation: { title: 'Running opportunities', notes: ORGANISER_GUIDE },
  admin: { title: 'Community admin', notes: OVERSIGHT_GUIDE },
}

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
  const name = user?.name ?? 'Guest'
  const { unread } = useNotifications()
  const workspace = workspaceFor(user?.role)
  const guide = GUIDES[workspace]

  return (
    <div className="shell">
      <aside className="side">
        <div className="side__brand"><Logo /></div>
        <div className="side__group">Your workspace</div>
        {/* The role, not the name: the name is already in the top bar. */}
        <div className="side__workspace">{WORKSPACE_LABEL[workspace]}</div>

        <nav className="side__nav" aria-label={`${WORKSPACE_LABEL[workspace]} navigation`}>
          {plates(WORKSPACE_NAV[workspace])}
        </nav>

        <div className="side__foot">
          <Link className="side__link" to="/privacy">Privacy</Link>
          {/* One way out, in the same place for every role. */}
          <button className="navplate navplate--danger"
            onClick={() => { signOut(); navigate('/signin') }}>
            <Icon name="signout" /> <span>Sign out</span>
          </button>
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

        <HelpButton title={guide.title} notes={guide.notes} />
      </div>
    </div>
  )
}
