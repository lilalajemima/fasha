import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { drawGoogleButton, googleClientId, type GoogleButtonText } from '../lib/google'
import './GoogleButton.css'

type Props = {
  text: GoogleButtonText
  onCredential: (credential: string) => void
  /** Puts "or" between the button and the form beneath it. */
  divider?: boolean
}

/**
 * Google's own button, drawn by Google's script. It shows nothing at all when
 * this copy of Fasha has no Google client id, so a fork without one still
 * looks finished.
 */
export default function GoogleButton({ text, onCredential, divider = false }: Props) {
  const slot = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const handle = useEffectEvent((credential: string) => onCredential(credential))

  useEffect(() => {
    const parent = slot.current

    if (!parent || !googleClientId) return

    let live = true

    drawGoogleButton(parent, text, credential => handle(credential))
      .then(() => live && setFailed(false))
      .catch(() => live && setFailed(true))

    return () => {
      live = false
    }
  }, [text])

  if (!googleClientId) return null

  return (
    <div className="google">
      <div ref={slot} className="google__slot" hidden={failed} />
      {failed && (
        <p className="muted google__offline">
          Signing in with Google needs a connection. Your email and password still work.
        </p>
      )}
      {divider && <div className="google__or"><span>or</span></div>}
    </div>
  )
}
