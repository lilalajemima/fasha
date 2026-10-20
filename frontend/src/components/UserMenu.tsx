import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { useAuth } from '../auth/AuthContext'
import { MANAGE_NAV, PARTICIPATE_NAV } from '../layouts/navItems'

function initials(name: string) {
  return name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()
}

// User account menu

export default function UserMenu() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const name = user?.name ?? 'Guest'
  const isVolunteer = user?.role !== 'organisation'

  function leave() {
    setOpen(false)
    signOut()
    navigate('/signin')
  }

  const group = (title: string, items: typeof MANAGE_NAV) => (
    <div className="menu__group">
      <div className="menu__title">{title}</div>
      {items.map(item => (
        <Link key={item.to} to={item.to} className="menu__item" onClick={() => setOpen(false)}>
          <Icon name={item.icon} /> {item.label}
        </Link>
      ))}
    </div>
  )

  return (
    <div className="menu">
      <button className="menu__trigger" aria-expanded={open} aria-haspopup="true"
              onClick={() => setOpen(!open)}>
        <span className="avatar">{initials(name)}</span>
        <span className="topbar__name">{name}</span>
        <span aria-hidden="true" style={{ fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <>
          <div className="menu__backdrop" onClick={() => setOpen(false)} />
          <div className="menu__panel" role="menu">
            <div className="menu__head">
              <strong>{name}</strong>
              <div className="muted">{isVolunteer ? 'Volunteer account' : 'Organisation account'}</div>
              <div className="muted">{user?.email}</div>
            </div>

            <div className="menu__group">
              <Link to="/notifications" className="menu__item" onClick={() => setOpen(false)}>
                <Icon name="bell" /> Notifications
              </Link>
            </div>

            <div className="menu__nav">
              {isVolunteer && group('Taking part', PARTICIPATE_NAV)}
              {group('Managing opportunities', MANAGE_NAV)}
            </div>

            <div className="menu__group">
              <button className="menu__item menu__item--danger" onClick={leave}>Sign out</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
