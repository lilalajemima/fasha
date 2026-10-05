import { useEffect, useState } from 'react'
import { Button, Card, Tag } from '../../components/ui'
import { getPortfolio, getProfile } from '../../mocks/api'
import type { PortfolioEntry, Profile } from '../../mocks/types'

/** Public, unauthenticated page. It never shows email, phone or any other personal detail. */
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
    <>
      <div className="row">
        <div>
          <h1>{profile.name}</h1>
          <p className="muted">{profile.location} - Community volunteer</p>
          <p>{profile.bio}</p>
        </div>
        <Button>Share portfolio</Button>
      </div>

      <Card>
        <div className="row">
          <span className="muted">fasha.org/p/{slug}</span>
          <a href={`/p/${slug}`}>Copy link</a>
        </div>
      </Card>

      <div style={{ margin: '24px 0' }}>
        <Card variant="tint">
          <div className="stat-row">
            <div><div className="muted">Verified service hours</div><div className="stat-value">{hours} h</div></div>
            <div><div className="muted">Completed initiatives</div><div className="stat-value">{entries.length}</div></div>
            <div><div className="muted">Credited skills</div><div className="stat-value">{skills.length}</div></div>
          </div>
          <hr />
          <p className="muted" style={{ margin: 0 }}>
            Every contribution below has been verified by its organiser.
          </p>
        </Card>
      </div>

      <div className="page-grid">
        <div>
          <h2>Completed initiatives</h2>
          <Card>
            {entries.map(entry => (
              <div key={entry.id} className="row"
                   style={{ borderTop: '1px solid var(--border)', padding: '14px 0', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ marginBottom: 2 }}>{entry.title}</h3>
                  <p className="muted" style={{ margin: 0 }}>{entry.organiser} - {entry.month}</p>
                  <p style={{ margin: '6px 0 0', color: 'var(--navy-700)', fontSize: 13 }}>
                    {entry.skill} credited
                  </p>
                </div>
                <span className="badge badge--ok">{entry.hours} h</span>
              </div>
            ))}
          </Card>
        </div>

        <aside className="stack">
          <Card>
            <h2>Credited skills</h2>
            <div className="cluster">{skills.map(skill => <Tag key={skill}>{skill}</Tag>)}</div>
            <p className="muted" style={{ marginTop: 12 }}>
              Skills credited through approved contributions, not self-reported tags.
            </p>
          </Card>
          <Card>
            <h2>About this portfolio</h2>
            <p className="muted" style={{ margin: 0 }}>
              This public page celebrates verified service. Pending tasks and unverified hours are not included.
            </p>
          </Card>
        </aside>
      </div>
    </>
  )
}
