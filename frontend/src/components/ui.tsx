import { useState } from 'react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import Icon from './Icon'
import './field.css'

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

export function StatusBadge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

/**
 * Every field in Fasha, and every password field with it: a password can be
 * shown, because the alternative is people choosing one they can type blind.
 * The toggle lives here rather than at each call site, so no form can forget.
 */
export function Field({ label, id, hint, error, ...rest }:
  InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; hint?: string; error?: string }) {
  const [shown, setShown] = useState(false)
  const secret = rest.type === 'password'

  return (
    <div className="field">
      <label className="label" htmlFor={id}>{label}</label>

      <div className={secret ? 'reveal' : undefined}>
        <input
          id={id}
          className="input"
          aria-invalid={!!error}
          {...rest}
          type={secret && shown ? 'text' : rest.type}
        />
        {secret && (
          <button
            type="button"
            className="reveal__toggle"
            aria-label={shown ? 'Hide password' : 'Show password'}
            aria-pressed={shown}
            onClick={() => setShown(value => !value)}
          >
            <Icon name={shown ? 'eyeOff' : 'eye'} size={18} />
          </button>
        )}
      </div>

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
