import type { ReactNode } from 'react'
import ImageSlider, { type Slide } from '../../components/ImageSlider'
import Imigongo from '../../components/Imigongo'
import Logo from '../../components/Logo'
import './Auth.css'

// WebP, about half the size of the JPEGs they came from. The first one is
// also asked for from index.html, before any of this code has loaded.
const SLIDES: Slide[] = [
  { src: '/auth/together.webp', caption: 'hands lifting something together' },
  { src: '/auth/hands.webp', caption: 'raised hands in many colours' },
  { src: '/auth/crowd.webp', caption: 'a painted crowd of people' },
]

export default function AuthPanel({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth__panel">
        <ImageSlider slides={SLIDES} />

        <div className="auth__panel-body">
          <div className="auth__brand"><Logo size={30} /></div>

          <div className="auth__words">
            <h1 className="auth__headline">Murakaza neza kuri Fasha</h1>

            <p className="auth__sub">
              Find meaningful ways to volunteer, bring people together and build a record of your
              contribution.
            </p>

                        <div style={{ maxWidth: 440 }}><Imigongo tone="light" /></div>
          </div>
        </div>
      </aside>

      <main className="auth__main">{children}</main>
    </div>
  )
}