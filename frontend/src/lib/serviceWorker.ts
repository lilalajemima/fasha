export function registerServiceWorker() {
  // Dev is left alone: a cache in front of the dev server only hides changes.
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}
