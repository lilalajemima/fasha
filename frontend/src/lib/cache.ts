const PREFIX = 'fasha.cache.'
const LIMIT = 250_000

export type Cached<T> = { at: number; data: T }

export function readCache<T>(path: string): Cached<T> | null {
  try {
    const saved = localStorage.getItem(PREFIX + path)

    if (!saved) return null

    const parsed = JSON.parse(saved) as Cached<T>

    if (typeof parsed?.at !== 'number') return null

    return parsed
  } catch {
    return null
  }
}

export function writeCache(path: string, data: unknown): boolean {
  try {
    const body = JSON.stringify({ at: Date.now(), data })

    // A page big enough to crowd out the rest is better left uncached.
    if (body.length > LIMIT) return false

    localStorage.setItem(PREFIX + path, body)

    return true
  } catch {
    return clearCache()
  }
}

export function clearCache(): boolean {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PREFIX)) localStorage.removeItem(key)
    }

    return true
  } catch {
    return false
  }
}
