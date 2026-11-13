import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import './report.css'

/**
 * A report built from what is already on screen and handed to the browser's
 * print dialog, where Save as PDF turns it into a file. That keeps the charts
 * as sharp as the page, needs no PDF library, and works on a phone. It is
 * drawn outside the app's root so that printing shows the report and nothing
 * else, and it removes itself once the dialog closes.
 */
export function PrintReport({ title, file, lines, onDone, children }: {
  title: string
  file: string
  lines: string[]
  onDone: () => void
  children: ReactNode
}) {
  const done = useRef(onDone)

  useEffect(() => {
    done.current = onDone
  })

  useEffect(() => {
    const before = document.title
    const finish = () => done.current()

    // Browsers name the saved PDF after the page title.
    document.title = file
    document.body.classList.add('is-printing-report')
    window.addEventListener('afterprint', finish)

    const frame = window.requestAnimationFrame(() => window.print())

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('afterprint', finish)
      document.title = before
      document.body.classList.remove('is-printing-report')
    }
  }, [file])

  return createPortal(
    <article className="report">
      <header className="report__head">
        <span className="report__brand">
          fasha<span className="report__dot" aria-hidden="true" />
        </span>
        <h1 className="report__title">{title}</h1>
        {lines.map(line => (
          <p key={line} className="report__line">{line}</p>
        ))}
      </header>
      {children}
    </article>,
    document.body,
  )
}

/** The rows of a report, on a page of their own after the summary. */
export function ReportRows({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="report__rows">
      <h2 className="report__section">{heading}</h2>
      {children}
    </section>
  )
}
