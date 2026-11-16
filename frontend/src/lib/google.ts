/**
 * Google's own sign-in button, loaded from Google only on the pages that show
 * it. Nothing here signs anybody in: the button hands back a credential, and
 * the server checks it with Google before believing a word of it.
 */

type ButtonOptions = {
  type: 'standard'
  theme: 'outline'
  size: 'large'
  text: GoogleButtonText
  shape: 'pill'
  logo_alignment: 'center'
  width: number
  click_listener: () => void
}

type GoogleId = {
  initialize(options: {
    client_id: string
    callback: (response: { credential: string }) => void
    ux_mode: 'popup'
    auto_select: false
    cancel_on_tap_outside: true
  }): void
  renderButton(parent: HTMLElement, options: ButtonOptions): void
  disableAutoSelect(): void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } }
  }
}

export type GoogleButtonText = 'signin_with' | 'signup_with' | 'continue_with'

const SCRIPT = 'https://accounts.google.com/gsi/client'

export const googleClientId: string | null =
  import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || null

let loading: Promise<GoogleId> | null = null

// Google calls one function for every button on the page, so each button
// claims it when it is clicked. The profile page can show two at once.
let claimed: ((credential: string) => void) | null = null

function load(clientId: string): Promise<GoogleId> {
  if (loading) return loading

  loading = new Promise<GoogleId>((resolve, reject) => {
    const ready = () => {
      const id = window.google?.accounts.id

      if (!id) return reject(new Error('Google sign-in did not load'))

      id.initialize({
        client_id: clientId,
        callback: response => claimed?.(response.credential),
        ux_mode: 'popup',
        auto_select: false,
        cancel_on_tap_outside: true,
      })
      resolve(id)
    }

    if (window.google?.accounts.id) return ready()

    const script = document.createElement('script')
    script.src = SCRIPT
    script.async = true
    script.onload = ready
    script.onerror = () => {
      script.remove()
      // Let the next page try again, say once the connection is back.
      loading = null
      reject(new Error('Google sign-in did not load'))
    }
    document.head.appendChild(script)
  })

  return loading
}

// Draws Google's button into `parent`. The returned promise fails offline.
export async function drawGoogleButton(
  parent: HTMLElement,
  text: GoogleButtonText,
  onCredential: (credential: string) => void,
): Promise<void> {
  if (!googleClientId) throw new Error('Google sign-in is not set up')

  const id = await load(googleClientId)

  parent.replaceChildren()
  id.renderButton(parent, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text,
    shape: 'pill',
    logo_alignment: 'center',
    // Google draws between 200 and 400 pixels wide, and only in whole pixels.
    width: Math.round(Math.min(400, Math.max(200, parent.clientWidth || 320))),
    click_listener: () => {
      claimed = onCredential
    },
  })
}

// After signing out, so Google does not pick the same account by itself.
export function forgetGoogleChoice(): void {
  window.google?.accounts.id.disableAutoSelect()
}
