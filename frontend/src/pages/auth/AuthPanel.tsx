import type { ReactNode } from 'react'
import Icon from '../../components/Icon'
import Imigongo from '../../components/Imigongo'
import Logo from '../../components/Logo'
import './Auth.css'

const POINTS = [
  { icon: 'discover', text: 'Find opportunities that fit your skills' },
  { icon: 'profile', text: 'Create change with others' },
  { icon: 'portfolio', text: 'Celebrate verified contributions' },
] as const

export default function AuthPanel({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth__panel">
        <div className="auth__brand"><Logo size={30} /></div>
        <h1 className="auth__headline">Your time.<br />Your community.<br />A little better.</h1>
        <p className="auth__sub">
          Find meaningful ways to volunteer, bring people together and build a record of your
          contribution.
        </p>
        <div style={{ maxWidth: 440 }}><Imigongo /></div>
        <ul className="auth__points">
          {POINTS.map(point => (
            <li key={point.text}>
              <span style={{ color: 'var(--imigongo-black)', display: 'flex' }}>
                <Icon name={point.icon} size={19} />
              </span>
              {point.text}
            </li>
          ))}
        </ul>
      </aside>
      <main className="auth__main">{children}</main>
    </div>
  )
}
