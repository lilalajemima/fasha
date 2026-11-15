const KEY = 'fasha.reloadedAt'
const WINDOW_MS = 10_000

/**
 * After a deploy, a tab opened earlier asks for page files that no longer
 * exist. Vite says so with a vite:preloadError event, and reloading once picks
 * up the new version. Offline, or failing again within a few seconds, it is
 * left to the page, which says what went wrong, instead of reloading in a loop.
 */
export function reloadWhenCodeIsStale(): void {
  window.addEventListener('vite:preloadError', event => {
    if (!navigator.onLine) return

    try {
      const last = Number(sessionStorage.getItem(KEY) ?? 0)

      if (Date.now() - last < WINDOW_MS) return

      sessionStorage.setItem(KEY, String(Date.now()))
    } catch {
      return
    }

    event.preventDefault()
    window.location.reload()
  })
}
