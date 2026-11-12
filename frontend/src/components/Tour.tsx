import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TourStep } from '../lib/tour'
import { Button } from './ui'
import './tour.css'

type Rect = { top: number; left: number; width: number; height: number }
type Layout = { target: Rect | null; vw: number; vh: number; cardH: number }
type Placement = { kind: 'dock' } | { kind: 'float'; top: number; left: number }

const PAD = 8
const GAP = 14
const EDGE = 16
const CARD_W = 360
const NARROW = 700

// A fallback such as the page banner is only used once the real target has
// had time to load. Without the wait, every step that points at data would
// flash the banner first and then jump.
const FALLBACK_AFTER = 1200

function close(a: number, b: number) {
  return Math.abs(a - b) < 1
}

function unchanged(prev: Layout, next: Layout) {
  if (prev.vw !== next.vw || prev.vh !== next.vh || !close(prev.cardH, next.cardH)) return false
  if (prev.target === null || next.target === null) return prev.target === next.target

  return close(prev.target.top, next.target.top) && close(prev.target.left, next.target.left) &&
    close(prev.target.width, next.target.width) && close(prev.target.height, next.target.height)
}

function clamp(value: number, low: number, high: number) {
  return Math.max(low, Math.min(value, high))
}

/**
 * Next to the thing it describes when there is room, below it first, then
 * above, then beside. Docked to the corner on a phone, when there is nothing
 * to point at, or when the target is taller than the screen, because a card
 * pinned to the middle of a long form would sit on top of what you are
 * meant to be filling in.
 */
function place({ target, vw, vh, cardH }: Layout): Placement {
  if (!target || vw < NARROW || target.height > vh * 0.55) return { kind: 'dock' }

  const left = clamp(target.left, EDGE, vw - CARD_W - EDGE)
  const below = target.top + target.height + GAP
  const above = target.top - GAP - cardH
  const beside = target.left + target.width + GAP

  if (below + cardH <= vh - EDGE) return { kind: 'float', top: below, left }
  if (above >= EDGE) return { kind: 'float', top: above, left }
  if (beside + CARD_W <= vw - EDGE) {
    return { kind: 'float', top: clamp(target.top, EDGE, vh - cardH - EDGE), left: beside }
  }

  return { kind: 'dock' }
}

/**
 * The first-time guide. It dims the page apart from the one thing a step is
 * about, and that thing stays usable: the first step asks you to fill in your
 * profile, which you could not do through a sheet of glass. Everything outside
 * the spotlight is blocked, so a stray tap cannot wander off mid-step, but if
 * you do leave the page the dimming lifts and the card waits for you.
 */
export default function Tour({ steps, step, onStep, onClose }: {
  steps: TourStep[]
  step: number
  onStep: (next: number) => void
  onClose: () => void
}) {
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)
  const cardRef = useRef<HTMLElement>(null)
  const [layout, setLayout] = useState<Layout>({ target: null, vw: 1024, vh: 768, cardH: 240 })

  const current = steps[step]
  const last = step === steps.length - 1

  useEffect(() => {
    navigateRef.current = navigate
  })

  // Keyed on the step, not the address: going to the step's page when it
  // changes, but leaving you alone if you follow a link from inside a step,
  // such as opening an opportunity to apply for it.
  useEffect(() => {
    const route = steps[step].route

    if (window.location.pathname !== route) navigateRef.current(route)
  }, [step, steps])

  useEffect(() => {
    const targets = steps[step].targets
    const began = performance.now()
    let scrolledTo = Number.POSITIVE_INFINITY

    function find(): { element: Element; rank: number } | null {
      const patient = performance.now() - began < FALLBACK_AFTER

      for (let rank = 0; rank < targets.length; rank += 1) {
        if (rank > 0 && patient) return null

        const element = document.querySelector(targets[rank])

        if (element) return { element, rank }
      }

      return null
    }

    function measure() {
      const found = find()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const cardH = cardRef.current?.offsetHeight ?? 240

      // Scroll once to each better target as it appears, then leave the page
      // to the person: the profile step needs them to scroll through a form.
      if (found && found.rank < scrolledTo) {
        scrolledTo = found.rank

        const tall = found.element.getBoundingClientRect().height > vh * 0.55
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        found.element.scrollIntoView({
          block: tall || vw < NARROW ? 'start' : 'center',
          behavior: still ? 'auto' : 'smooth',
        })
      }

      const box = found?.element.getBoundingClientRect()
      const target = box ? { top: box.top, left: box.left, width: box.width, height: box.height } : null
      const next = { target, vw, vh, cardH }

      setLayout(prev => (unchanged(prev, next) ? prev : next))
    }

    const frame = window.requestAnimationFrame(measure)

    // Polling as well as listening, because what moves the target is often
    // not a scroll or a resize: data arriving, a card expanding, a font
    // finishing loading. One lookup every 150ms is nothing next to that.
    const timer = window.setInterval(measure, 150)

    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { passive: true, capture: true })

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearInterval(timer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, { capture: true })
    }
  }, [step, steps])

  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true })
  }, [step])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const placement = place(layout)
  const spot = layout.target && {
    top: layout.target.top - PAD,
    left: layout.target.left - PAD,
    width: layout.target.width + PAD * 2,
    height: layout.target.height + PAD * 2,
  }

  return (
    <div className="tour">
      {spot && (
        <>
          <div className="tour__spot" aria-hidden="true" style={spot} />
          <div className="tour__block" aria-hidden="true"
               style={{ top: 0, left: 0, right: 0, height: Math.max(0, spot.top) }} />
          <div className="tour__block" aria-hidden="true"
               style={{ top: spot.top + spot.height, left: 0, right: 0, bottom: 0 }} />
          <div className="tour__block" aria-hidden="true"
               style={{ top: spot.top, left: 0, width: Math.max(0, spot.left), height: spot.height }} />
          <div className="tour__block" aria-hidden="true"
               style={{ top: spot.top, left: spot.left + spot.width, right: 0, height: spot.height }} />
        </>
      )}

      <section
        ref={cardRef}
        className={`tour__card${placement.kind === 'dock' ? ' tour__card--dock' : ''}`}
        style={placement.kind === 'float' ? { top: placement.top, left: placement.left } : undefined}
        role="dialog"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        tabIndex={-1}
      >
        <div className="tour__top">
          <span className="tour__count">Step {step + 1} of {steps.length}</span>
          <button type="button" className="tour__skip" onClick={onClose}>
            Skip guide
          </button>
        </div>

        <div key={step} className="tour__content">
          <h2 id="tour-title" className="tour__title">{current.title}</h2>
          <p id="tour-body" className="tour__body">{current.body}</p>
        </div>

        <div className="tour__foot">
          <ol className="tour__dots" aria-hidden="true">
            {steps.map((entry, index) => (
              <li
                key={entry.title}
                className={index === step ? 'is-on' : index < step ? 'is-done' : undefined}
              />
            ))}
          </ol>

          <div className="tour__actions">
            {step > 0 && <Button onClick={() => onStep(step - 1)}>Back</Button>}
            <Button variant="primary" onClick={() => (last ? onClose() : onStep(step + 1))}>
              {current.next ?? (last ? 'Finish' : 'Next')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
