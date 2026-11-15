// Stand-ins for the browser's localStorage, for tests that run in Node. Saved
// values are the object's own keys, as they are in a browser, so code that
// walks Object.keys(localStorage) sees the same thing here.
export function memoryStorage(): Storage {
  const storage: Record<string, string> = {}

  Object.defineProperties(storage, {
    getItem: { value: (key: string) => (Object.hasOwn(storage, key) ? storage[key] : null), configurable: true },
    setItem: { value: (key: string, value: string) => { storage[key] = String(value) }, configurable: true },
    removeItem: { value: (key: string) => { delete storage[key] }, configurable: true },
  })

  return storage as unknown as Storage
}

// What a browser with site data blocked does: touching storage at all throws,
// listing its keys included.
export function blockedStorage(): Storage {
  const refuse = (): never => {
    throw new DOMException('The operation is insecure.', 'SecurityError')
  }

  return new Proxy({}, { get: refuse, ownKeys: refuse }) as Storage
}

// A storage that is full: reading works, saving throws.
export function fullStorage(start: Record<string, string> = {}): Storage {
  const storage = memoryStorage()

  for (const [key, value] of Object.entries(start)) storage.setItem(key, value)

  Object.defineProperty(storage, 'setItem', {
    value: () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    },
  })

  return storage
}
