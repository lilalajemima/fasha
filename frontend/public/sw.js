const VERSION = 'fasha-v1'
const SHELL = `${VERSION}-shell`
const FONTS = `${VERSION}-fonts`
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com']

const OFFLINE_PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fasha is offline</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center;
             background: #FDFBFB; color: #18181B; text-align: center; padding: 24px;
             font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; }
      h1 { font-size: 20px; margin: 0 0 8px; }
      p { color: #3F3F46; font-size: 15px; margin: 0; max-width: 32ch; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div>
      <h1>Fasha is offline</h1>
      <p>Open this page again once you have a connection.</p>
    </div>
  </body>
</html>`

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(names =>
        Promise.all(names.filter(name => !name.startsWith(VERSION)).map(name => caches.delete(name))),
      )
      .then(() => self.clients.claim()),
  )
})

async function fromCacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(request)

  if (hit) return hit

  const response = await fetch(request)

  // An opaque response has status 0, so `ok` is false even when it arrived.
  // The font files come back that way and are still worth keeping.
  if (response.ok || response.type === 'opaque') cache.put(request, response.clone())

  return response
}

async function fromNetworkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)

  try {
    const response = await fetch(request)

    if (response.ok) cache.put(request, response.clone())

    return response
  } catch (problem) {
    const hit = await cache.match(request)

    if (hit) return hit

    throw problem
  }
}

// Every route is served the same document, so one copy under /index.html
// answers for all of them.
async function page(request) {
  const cache = await caches.open(SHELL)

  try {
    const response = await fetch(request)

    if (response.ok) cache.put('/index.html', response.clone())

    return response
  } catch {
    const hit = await cache.match('/index.html')

    if (hit) return hit

    return new Response(OFFLINE_PAGE, {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}

self.addEventListener('fetch', event => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (request.mode === 'navigate') {
    event.respondWith(page(request))
    return
  }

  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(fromCacheFirst(request, FONTS))
    return
  }

  // The API is a different origin and is left alone: what it returns is
  // personal and is cached in the app instead, where signing out clears it.
  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(fromCacheFirst(request, SHELL))
    return
  }

  event.respondWith(fromNetworkFirst(request, SHELL))
})
