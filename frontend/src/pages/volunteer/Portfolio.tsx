import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../../components/Icon'
import { Loaded } from '../../components/Loader'
import Logo from '../../components/Logo'
import { Button, Card, EmptyState, Tag } from '../../components/ui'
import { longDate, sentenceCase } from '../../lib/format'
import type { PortfolioView } from '../../lib/types'
import { useGet } from '../../lib/useGet'
import './Portfolio.css'

function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <Button
      onClick={() => {
        navigator.clipboard?.writeText(link)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <Icon name="share" /> {copied ? 'Link copied' : 'Copy link'}
      </span>
    </Button>
  )
}

export default function Portfolio() {
  const { slug } = useParams()
  // No slug means the owner is looking at their own page, so give them a way back.
  const preview = !slug
  const portfolio = useGet<PortfolioView>(slug ? `/p/${slug}` : '/portfolio/mine')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-base)' }}>
            <header className="topbar">
        <Logo size={24} />
        <div className="topbar__right">
          {preview && <Link to="/profile">← Back to Fasha</Link>}
        </div>
      </header>

      <div className="pf-body">
        <Loaded state={portfolio} what="this portfolio">
          {view => {
            const link = `${window.location.origin}/p/${view.volunteer.portfolioSlug}`

            return (
              <>
                <section className="banner pf-banner">
                  <div className="pf-banner__row">
                    <div>
                      <h1 className="banner__title">{view.volunteer.name}</h1>
                      <p className="pf-banner__role">Volunteer</p>
                    </div>
                    <CopyLink link={link} />
                  </div>
                </section>

                <main className="pf-sheet">
                  <Card>
                    <div className="stat-row">
                      <div>
                        <div className="stat-label">Hours verified</div>
                        <div className="stat-value">{view.totals.hours}</div>
                      </div>
                      <div>
                        <div className="stat-label">Initiatives joined</div>
                        <div className="stat-value">{view.totals.opportunities}</div>
                      </div>
                      <div>
                        <div className="stat-label">Initiatives organised</div>
                        <div className="stat-value">{view.totals.organised}</div>
                      </div>
                      <div>
                        <div className="stat-label">Skills</div>
                        <div className="stat-value">{view.totals.skills.length}</div>
                      </div>
                    </div>
                  </Card>

                  <h2 className="pf-heading">Skills</h2>
                  <Card>
                    <p className="muted" style={{ marginTop: 14, marginBottom: 0 }}>
                      Credited through approved contributions, not self-reported tags.
                    </p>
                    <div className="cluster">
                      {view.totals.skills.map(skill => <Tag key={skill}>{skill}</Tag>)}
                    </div>
                  </Card>

                  <h2 className="pf-heading">Completed initiatives</h2>
                  {view.entries.length === 0 ? (
                    <Card>
                      <EmptyState>
                        Nothing verified yet. Hours appear here once an organiser confirms them.
                      </EmptyState>
                    </Card>
                  ) : (
                    <div className="pf-track">
                      {view.entries.map(entry => (
                        <article key={entry.id} className="pf-card">
                          <div>
                            <h3 className="pf-card__title">{entry.opportunity.title}</h3>
                            <p className="pf-card__meta">
                              {sentenceCase(entry.opportunity.mode)} · {longDate(entry.creditedOn)}
                            </p>
                          </div>
                          <div>
                            {entry.skills.length > 0 && (
                              <p className="pf-card__skills">
                                ✓ {entry.skills.join(', ')} credited
                              </p>
                            )}
                            <div className="pf-card__hours">{entry.hours} h</div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </main>
              </>
            )
          }}
        </Loaded>
      </div>
    </div>
  )
}