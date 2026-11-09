import { useEffect, useState } from 'react'

const PREFIX = 'fasha.draft.'

function read<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(PREFIX + key)

    if (!saved) return fallback

    return { ...fallback, ...(JSON.parse(saved) as object) } as T
  } catch {
    return fallback
  }
}

function has(key: string): boolean {
  try {
    return localStorage.getItem(PREFIX + key) !== null
  } catch {
    return false
  }
}

function save(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))

    return true
  } catch {
    return false
  }
}

function forget(key: string): boolean {
  try {
    localStorage.removeItem(PREFIX + key)

    return true
  } catch {
    return false
  }
}

export function useDraft<T extends object>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => read(key, initial))
  const [restored] = useState(() => has(key))

  useEffect(() => {
    save(key, value)
  }, [key, value])

  const discard = () => forget(key)

  return [value, setValue, discard, restored] as const
}

export function clearDrafts() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PREFIX)) localStorage.removeItem(key)
    }
  } catch {
    return
  }
}