// The database tests empty every table before they run, so they must never
// be pointed at Supabase. Only a database on this computer is allowed.
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]']

export function isLocalDatabase(url: string | undefined): boolean {
  if (!url) return false

  try {
    const parsed = new URL(url)

    return ['postgres:', 'postgresql:'].includes(parsed.protocol) && LOCAL_HOSTS.includes(parsed.hostname)
  } catch {
    return false
  }
}
