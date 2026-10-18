import type { ReactNode } from 'react'
import Imigongo from './Imigongo'

/** Every page opens the same way: optional kicker, display title, meta line, Imigongo band. */
export default function PageHeader({ eyebrow, title, meta, action }: {
  eyebrow?: ReactNode
  title: string
  meta?: ReactNode
  action?: ReactNode
}) {
  return (
    <header className="page-head">
      <div className="page-head__top">
        <div style={{ minWidth: 0 }}>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {meta && <p className="lede">{meta}</p>}
        </div>
        {action}
      </div>
      <div style={{ marginTop: 14 }}><Imigongo /></div>
    </header>
  )
}
