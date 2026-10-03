import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui'
import './Shell.css'

export type NavItem = { to: string; label: string; end?: boolean }

function initials(name: string) {
  return name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()
}

export default function Shell({ workspace, strapline, items, cta }: {
  workspace: string
  strapline: string
  items: NavItem[]
  cta?: { to: string; label: string }
}) {
  const { user } = useAuth()
  const name = user?.name ?? 'Guest'

  return (
    <div className="shell">
      <aside className="side">
        <div className="side__brand">fasha</div>
        <div className="side__group">Your workspace</div>
        <div className="side__workspace">{workspace}</div>
        <nav className="side__nav">
          {items.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}>{item.label}</NavLink>
          ))}
        </nav>
        {cta && (
          <div className="side__cta">
            <Link to={cta.to}><Button block>+ {cta.label}</Button></Link>
          </div>
        )}
        <div className="side__foot">
          <div>Help &amp; support</div>
          <div>Small actions. Shared impact.</div>
        </div>
      </aside>

      <div>
        <header className="topbar">
          <span className="muted">{strapline}</span>
          <div className="topbar__right">
            <span className="badge badge--ok">3</span>
            <span className="avatar">{initials(name)}</span>
            <span>{name}</span>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>

      <nav className="tabbar" aria-label="Sections">
        {items.slice(0, 4).map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}>{item.label}</NavLink>
        ))}
      </nav>
    </div>
  )
}
