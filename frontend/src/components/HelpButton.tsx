import { useEffect, useState } from 'react'

export type HelpNote = { question: string; answer: string }

/**
 * A round help button pinned to the corner of the page. The guidance that used
 * to sit as paragraphs between the controls lives in here instead, so a page
 * stays quiet until somebody actually wants to be told how it works.
 */
export default function HelpButton({ title, notes }: { title: string; notes: HelpNote[] }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="help">
      {open && (
        <div className="help__panel" role="dialog" aria-label={`${title} help`}>
          <h3>{title}</h3>
          {notes.map(note => (
            <div key={note.question} className="help__item">
              <p className="help__q">{note.question}</p>
              <p className="help__a">{note.answer}</p>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="help__toggle"
        aria-expanded={open}
        aria-label={open ? 'Close help' : 'How this page works'}
        onClick={() => setOpen(value => !value)}
      >
        {open ? '×' : '?'}
      </button>
    </div>
  )
}
