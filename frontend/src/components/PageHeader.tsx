import type { ReactNode } from 'react'
import Imigongo from './Imigongo'

/**
 * Every page opens the same way: the title, whatever action belongs to it, and
 * the Imigongo band. Explanation belongs in the help button rather than the
 * heading, so `eyebrow` and `meta` are still accepted but no longer drawn.
 */
export default function PageHeader({ title, action, display }: {
  eyebrow?: ReactNode
  title: string
  meta?: ReactNode
  action?: ReactNode
  display?: boolean
}) {
  return (
    <header className={`page-head${display ? ' page-head--display' : ''}`}>
      <div className="page-head__top">
        <h1 style={{ minWidth: 0, margin: 0 }}>{title}</h1>
        {action}
      </div>
      <div style={{ marginTop: 14 }}><Imigongo /></div>
    </header>
  )
}
