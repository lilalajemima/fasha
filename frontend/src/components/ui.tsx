import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral' | 'match'

export function Button({ variant = 'default', block, className = '', ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary'; block?: boolean }) {
  const classes = ['btn', variant === 'primary' && 'btn--primary', block && 'btn--block', className]
  return <button {...rest} className={classes.filter(Boolean).join(' ')} />
}

export function Card({ variant, children }: { variant?: 'tint' | 'note'; children: ReactNode }) {
  return <section className={`card ${variant ? `card--${variant}` : ''}`}>{children}</section>
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="tag">{children}</span>
}

export function RemovableTag({ children, onRemove }: { children: ReactNode; onRemove: () => void }) {
  return (
    <span className="tag">
      {children}{' '}
      <button className="chip-x" onClick={onRemove} aria-label={`Remove ${children}`}>×</button>
    </span>
  )
}

export function StatusBadge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function StatTile({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  )
}

export function Field({ label, id, hint, error, ...rest }:
  InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; hint?: string; error?: string }) {
  return (
    <div className="field">
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} className="input" aria-invalid={!!error} {...rest} />
      {hint && !error && <div className="hint">{hint}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  )
}

export function TextField({ label, id, hint, ...rest }:
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; id: string; hint?: string }) {
  return (
    <div className="field">
      <label className="label" htmlFor={id}>{label}</label>
      <textarea id={id} className="input" {...rest} />
      {hint && <div className="hint">{hint}</div>}
    </div>
  )
}

export function FileDrop({ label, hint }: { label: string; hint: string }) {
  return (
    <label className="dropzone">
      <input type="file" style={{ display: 'none' }} />
      <div style={{ fontSize: 18, lineHeight: 1 }}>↑</div>
      <div style={{ marginTop: 6 }}>{label}</div>
      <div className="muted" style={{ marginTop: 4 }}>{hint}</div>
    </label>
  )
}

export function Tabs({ items, active, onChange }:
  { items: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="tabs" role="tablist">
      {items.map(t => (
        <button key={t.id} role="tab" aria-selected={active === t.id} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>
}
