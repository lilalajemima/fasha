import { useParams } from 'react-router-dom'
import Icon from '../../components/Icon'
import Imigongo from '../../components/Imigongo'
import { Loaded } from '../../components/Loader'
import Logo from '../../components/Logo'
import { Button, Card, EmptyState, StatusBadge, Tag } from '../../components/ui'
import { initials, longDate, sentenceCase } from '../../lib/format'
import type { PortfolioView } from '../../lib/types'
import { useGet } from '../../lib/useGet'

export default function Portfolio() {
  const { slug } = useParams()
  const portfolio = useGet<PortfolioView>(slug ? `/p/${slug}` : '/portfolio/mine')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-base)' }}>
      <header className="topbar">
        <Logo size={24} />
        <div className="topbar__right">
          <span className="muted">Public volunteer portfolio</span>
        </div>
      </header>

      <main style={{ maxWidth: 1140, margin: '0 auto', padding: '40px 24px 72px' }}>
        <Loaded state={portfolio} what="this portfolio">
          {view => {
            const link = `${window.location.origin}/p/${view.volunteer.portfolioSlug}`

            return (
              <>
                <div className="page-head__top">
                  <div className="cluster" style={{ gap: 20, alignItems: 'flex-start' }}>
                    <span className="avatar" style={{ width: 86, height: 86, fontSize: 26 }}>
                      {initials(view.volunteer.name)}
                    </span>
                    <div>
                      <h1>{view.volunteer.name}</h1>
                      <p className="muted" style={{ margin: 0 }}>Community volunteer</p>
                    </div>
                  </div>
                  <Button onClick={() => navigator.clipboard?.writeText(link)}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="share" /> Copy link
                    </span>
                  </Button>
                </div>

                <div style={{ margin: '22px 0 26px' }}><Imigongo /></div>

                <Card>
                  <span className="cluster" style={{ gap: 10, color: 'var(--charcoal-muted)' }}>
                    <Icon name="link" /> {link}
                  </span>
                </Card>

                <div style={{ margin: '20px 0 30px' }}>
                  <Card>
                    <div className="stat-row">
                      <div>
                        <div className="stat-label">Verified service hours</div>
                        <div className="stat-value">{view.totals.hours} h</div>
                      </div>
                      <div>
                        <div className="stat-label">Completed initiatives</div>
                        <div className="stat-value">{view.totals.opportunities}</div>
                      </div>
                      <div>
                        <div className="stat-label">Credited skills</div>
                        <div className="stat-value">{view.totals.skills.length}</div>
                      </div>
                    </div>
                    <hr />
                    <p className="muted" style={{ margin: 0 }}>
                      Every contribution below was verified by the organiser who ran it.
                    </p>
                  </Card>
                </div>

                <div className="page-grid">
                  <div>
                    <h2 style={{ fontSize: 22 }}>Completed initiatives</h2>
                    <Card>
                      <div className="divided">
                        {view.entries.map(entry => (
                          <div key={entry.id} className="row" style={{ alignItems: 'flex-start' }}>
                            <div>
                              <h3 style={{ marginBottom: 2 }}>{entry.opportunity.title}</h3>
                              <p className="muted" style={{ margin: 0 }}>
                                {sentenceCase(entry.opportunity.mode)} · {longDate(entry.creditedOn)}
                              </p>
                              {entry.skills.length > 0 && (
                                <p style={{ margin: '6px 0 0', color: 'var(--primary)', fontSize: 13, fontWeight: 500 }}>
                                  ✓ {entry.skills.join(', ')} credited
                                </p>
                              )}
                            </div>
                            <StatusBadge tone="bad">{entry.hours} h</StatusBadge>
                          </div>
                        ))}
                        {view.entries.length === 0 && (
                          <EmptyState>
                            Nothing verified yet. Hours appear here once an organiser confirms them.
                          </EmptyState>
                        )}
                      </div>
                    </Card>
                  </div>

                  <aside>
                    <Card>
                      <h2>Credited skills</h2>
                      <div className="cluster">
                        {view.totals.skills.map(skill => <Tag key={skill}>{skill}</Tag>)}
                      </div>
                      <p className="muted" style={{ marginTop: 14, marginBottom: 0 }}>
                        Credited through approved contributions, not self-reported tags.
                      </p>
                    </Card>
                  </aside>
                </div>

                <p className="muted" style={{ marginTop: 34 }}>
                  Only approved, verified contributions are shown. Pending claims are not included.
                </p>
              </>
            )
          }}
        </Loaded>
      </main>
    </div>
  )
}
