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
        <h1 className="auth__headline">Mukarakaza neza <br />Kuri<br />Fasha</h1>
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
