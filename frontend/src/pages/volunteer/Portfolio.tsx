import { useEffect, useState } from 'react'
import Icon from '../../components/Icon'
import Imigongo from '../../components/Imigongo'
import Logo from '../../components/Logo'
import { Button, Card, StatusBadge, Tag } from '../../components/ui'
import { getPortfolio, getProfile } from '../../mocks/api'
import type { PortfolioEntry, Profile } from '../../mocks/types'

/** Public page. It shows no email, phone or any other personal detail. */
export default function Portfolio() {
  const [entries, setEntries] = useState<PortfolioEntry[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    getPortfolio().then(setEntries)
    getProfile().then(setProfile)
  }, [])
  if (!profile) return null

  const hours = entries.reduce((total, entry) => total + entry.hours, 0)
  const skills = [...new Set(entries.map(entry => entry.skill))]
  const slug = profile.name.toLowerCase().replace(/\s+/g, '-')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-base)' }}>
      <header className="topbar">
        <Logo size={24} />
        <div className="topbar__right">
          <span className="muted">Public volunteer portfolio</span>
          <Button>Explore Fasha</Button>
        </div>
      </header>

      <main style={{ maxWidth: 1140, margin: '0 auto', padding: '40px 24px 72px' }}>
        <div className="page-head__top">
          <div className="cluster" style={{ gap: 20, alignItems: 'flex-start' }}>
            <span className="avatar" style={{ width: 86, height: 86, fontSize: 26 }}>AM</span>
            <div>
              <h1>{profile.name}</h1>
              <p className="muted">{profile.location} · Community volunteer</p>
              <p style={{ margin: 0 }}>{profile.bio}</p>
            </div>
          </div>
          <Button><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Icon name="share" /> Share portfolio
          </span></Button>
        </div>

        <div style={{ margin: '22px 0 26px' }}><Imigongo /></div>

        <Card>
          <div className="row">
            <span className="cluster" style={{ gap: 10, color: 'var(--charcoal-muted)' }}>
              <Icon name="link" /> fasha.org/p/{slug}
            </span>
            <a href={`/p/${slug}`}>Copy link</a>
          </div>
        </Card>

        <div style={{ margin: '20px 0 30px' }}>
          <Card>
            <div className="stat-row">
              <div><div className="stat-label">Verified service hours</div><div className="stat-value">{hours} h</div></div>
              <div><div className="stat-label">Completed initiatives</div><div className="stat-value">{entries.length}</div></div>
              <div><div className="stat-label">Credited skills</div><div className="stat-value">{skills.length}</div></div>
            </div>
            <hr />
            <p className="muted" style={{ margin: 0 }}>
              ✓ Every contribution below has been verified by its organiser.
            </p>
          </Card>
        </div>

        <div className="page-grid">
          <div>
            <h2 style={{ fontSize: 22 }}>Completed initiatives</h2>
            <Card>
              <div className="divided">
                {entries.map(entry => (
                  <div key={entry.id} className="row" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ marginBottom: 2 }}>{entry.title}</h3>
                      <p className="muted" style={{ margin: 0 }}>{entry.organiser} · {entry.month}</p>
                      <p style={{ margin: '6px 0 0', color: 'var(--primary)', fontSize: 13, fontWeight: 500 }}>
                        ✓ {entry.skill} credited
                      </p>
                    </div>
                    <StatusBadge tone="bad">{entry.hours} h</StatusBadge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <aside>
            <Card>
              <h2>Credited skills</h2>
              <div className="cluster">{skills.map(skill => <Tag key={skill}>{skill}</Tag>)}</div>
              <p className="muted" style={{ marginTop: 14, marginBottom: 0 }}>
                Skills credited through approved contributions, not self-reported tags.
              </p>
            </Card>
          </aside>
        </div>

        <p className="muted" style={{ marginTop: 34 }}>
          Only approved, verified contributions are shown. Pending tasks and unverified hours are
          not included.
        </p>
      </main>
    </div>
  )
}
