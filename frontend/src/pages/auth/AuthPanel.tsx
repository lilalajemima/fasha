import type { ReactNode } from 'react'
import './Auth.css'

/** The navy-tinted left panel shared by sign up and sign in. */
export default function AuthPanel({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth__panel">
        <div className="auth__brand">fasha</div>
        <p className="auth__kicker">A place to make a difference</p>
        <h1 className="auth__headline">Your time.<br />Your community.<br />A little better.</h1>
        <p className="auth__sub">
          Find meaningful ways to volunteer, bring people together and build a record of your contribution.
        </p>
        <ul className="auth__points">
          <li>Find opportunities that fit your skills</li>
          <li>Create change with others</li>
          <li>Celebrate verified contributions</li>
        </ul>
      </aside>
      <main className="auth__main">{children}</main>
    </div>
  )
}
