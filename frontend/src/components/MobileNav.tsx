import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import Logo from './Logo'
import { useAuth } from '../auth/AuthContext'
import { WORKSPACE_LABEL, WORKSPACE_NAV, workspaceFor } from '../layouts/navItems'

export default function MobileNav() {
  const { user, signOut } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  // The page the menu was opened on. Following a link changes the page, which
  // closes the menu without anything having to close it.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const workspace = workspaceFor(user?.role)
  const items = WORKSPACE_NAV[workspace]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenOn(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <button className="burger" aria-label="Open navigation" aria-expanded={open}
              onClick={() => setOpenOn(pathname)}>
        <Icon name="menu" size={21} />
      </button>

      {open && (
        <>
          <div className="drawer__backdrop" onClick={() => setOpenOn(null)} />
          <nav className="drawer" aria-label="Main navigation">
            <div className="drawer__head">
              <Logo size={24} />
              <button className="burger" aria-label="Close navigation" onClick={() => setOpenOn(null)}>
                <Icon name="close" size={21} />
              </button>
            </div>

            <div className="drawer__who">
              <span className="side__group">Your workspace</span>
              <div className="side__workspace">{WORKSPACE_LABEL[workspace]}</div>
            </div>

            <div className="drawer__group">
              {items.map(item => (
                <NavLink key={item.to} to={item.to} end={item.end} className="navplate">
                  <Icon name={item.icon} /> <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* One way out, in the same place for every role. */}
            <div className="drawer__group">
              <button className="navplate navplate--danger"
                      onClick={() => { signOut(); navigate('/signin') }}>
                <Icon name="signout" /> <span>Sign out</span>
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  )
}