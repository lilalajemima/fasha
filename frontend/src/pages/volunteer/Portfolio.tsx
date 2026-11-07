import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../../components/Icon'
import { Loaded } from '../../components/Loader'
import Logo from '../../components/Logo'
import { AvailabilityChips } from '../../components/Pickers'
import { Button, Card, EmptyState, Tag } from '../../components/ui'
import { apiUrl } from '../../lib/api'
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

function Tags({ values }: { values: string[] }) {
  if (values.length === 0) return null

  return (
    <div className="cluster pf-card__tags">
      {values.slice(0, 3).map(value => <Tag key={value}>{value}</Tag>)}
      {values.length > 3 && <span className="pf-card__more">+{values.length - 3}</span>}
    </div>
  )
}

function Brief({ brief }: { brief: { name: string; url: string } | null }) {
  if (!brief) return null

  return (
    <a className="pf-card__brief" href={apiUrl(brief.url)} target="_blank" rel="noreferrer">
      Brief ↗
    </a>
  )
}

export default function Portfolio() {
  const { slug } = useParams()
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
                    <div className="pf-who">
                      {view.volunteer.avatar && (
                        <img className="pf-who__picture" src={view.volunteer.avatar} alt="" />
                      )}
                      <div>
                        <h1 className="banner__title">{view.volunteer.name}</h1>
                        <p className="pf-banner__role">Volunteer</p>
                      </div>
                    </div>
                    <CopyLink link={link} />
                  </div>
                </section>

                <main className="pf-sheet">
                  {view.volunteer.bio && <p className="pf-bio">{view.volunteer.bio}</p>}

                  {view.volunteer.availabilitySlots.length > 0 && (
                    <div className="pf-when">
                      <span className="pf-when__label">Usually free</span>
                      <AvailabilityChips slots={view.volunteer.availabilitySlots} />
                    </div>
                  )}

                  {/* One sheet, not a stack of cards: the numbers, what they
                      can do, and what they have done read as one person. */}
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
                    </div>

                    {(view.volunteer.skills.length > 0 ||
                      view.volunteer.interests.length > 0) && (
                      <>
                        <hr />
                        <h2>Skills and interests</h2>

                        {view.volunteer.skills.length > 0 && (
                          <>
                            <div className="label">Skills</div>
                            <div className="cluster">
                              {view.volunteer.skills.map(skill => <Tag key={skill}>{skill}</Tag>)}
                            </div>
                          </>
                        )}

                        {view.volunteer.interests.length > 0 && (
                          <>
                            <div className="label" style={{ marginTop: 16 }}>Interests</div>
                            <div className="cluster">
                              {view.volunteer.interests.map(area => <Tag key={area}>{area}</Tag>)}
                            </div>
                          </>
                        )}

                        {view.totals.skills.length > 0 && (
                          <p className="pf-stat-note">
                            Verified through completed work: {view.totals.skills.join(', ')}.
                          </p>
                        )}
                      </>
                    )}

                    <hr />
                    <h2>Took part in</h2>

                    {view.entries.length === 0 ? (
                      <EmptyState>
                        Nothing verified yet. Hours appear here once an organiser confirms them.
                      </EmptyState>
                    ) : (
                      <div className="pf-track">
                        {view.entries.map(entry => (
                          <article key={entry.id} className="pf-card">
                            <div>
                              <h3 className="pf-card__title">{entry.opportunity.title}</h3>
                              <p className="pf-card__meta">
                                {entry.opportunity.organiser} ·{' '}
                                {sentenceCase(entry.opportunity.mode)} ·{' '}
                                {longDate(entry.creditedOn)}
                              </p>
                              <p className="pf-card__body">{entry.opportunity.description}</p>
                              <Tags
                                values={[
                                  ...entry.opportunity.requiredSkills,
                                  ...entry.opportunity.categories,
                                ]}
                              />
                            </div>

                            <div className="pf-card__foot">
                              <span className="pf-card__hours">{entry.hours} h</span>
                              <Brief brief={entry.opportunity.brief} />
                            </div>
                          </article>
                        ))}
                      </div>
                    )}

                    {view.organised.length > 0 && (
                      <>
                        <hr />
                        <h2>Organised themselves</h2>

                        <div className="pf-track">
                          {view.organised.map(item => (
                            <article key={item.id} className="pf-card">
                              <div>
                                <h3 className="pf-card__title">{item.title}</h3>
                                <p className="pf-card__meta">
                                  {sentenceCase(item.mode)}
                                  {item.location ? ` · ${item.location}` : ''}
                                  {item.happenedOn ? ` · ${longDate(item.happenedOn)}` : ''}
                                </p>
                                <p className="pf-card__body">{item.description}</p>
                                <Tags values={[...item.requiredSkills, ...item.categories]} />
                              </div>

                              <div className="pf-card__foot">
                                <span className="pf-card__hours">
                                  {item.people}
                                  <span className="pf-card__unit">
                                    {item.people === 1 ? ' person' : ' people'}
                                  </span>
                                </span>
                                <Brief brief={item.brief} />
                              </div>
                            </article>
                          ))}
                        </div>
                      </>
                    )}
                  </Card>
                </main>
              </>
            )
          }}
        </Loaded>
      </div>
    </div>
  )
}