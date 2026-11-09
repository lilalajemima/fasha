import { useEffect, useState } from 'react'
import '../styles/offline.css'

export default function OfflineNote() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)

    update()

    window.addEventListener('online', update)
    window.addEventListener('offline', update)

    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (!offline) return null

  return (
    <p className="offline" role="status">
      You are offline. Pages show what was saved the last time you were connected, and
      anything you send needs a connection.
    </p>
  )
}
