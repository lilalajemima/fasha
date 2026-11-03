import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { Button, Card } from './ui'

export type ScannedCode = {
  opportunityId: string
  code: string
}

function readFashaLink(text: string): ScannedCode | null {
  try {
    const url = new URL(text)
    const opportunityId = url.searchParams.get('o') ?? ''
    const code = (url.searchParams.get('c') ?? '').replace(/\D/g, '')

    if (!opportunityId || code.length !== 6) return null

    return { opportunityId, code }
  } catch {
    return null
  }
}

export default function QrScanner({ onFound, onClose }: {
  onFound: (scanned: ScannedCode) => void
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState('')
  const [hint, setHint] = useState('Point the camera at the code on the screen.')

  useEffect(() => {
    let stream: MediaStream | null = null
    let frame = 0
    let live = true

    function scan() {
      const video = videoRef.current
      const canvas = canvasRef.current

      if (!live || !video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        frame = requestAnimationFrame(scan)
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const context = canvas.getContext('2d', { willReadFrequently: true })

      if (!context) {
        frame = requestAnimationFrame(scan)
        return
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      const image = context.getImageData(0, 0, canvas.width, canvas.height)
      const found = jsQR(image.data, image.width, image.height)

      if (found) {
        const scanned = readFashaLink(found.data)

        if (scanned) {
          live = false
          onFound(scanned)
          return
        }

        setHint('That is not a Fasha code. Try the one on the organiser screen.')
      }

      frame = requestAnimationFrame(scan)
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(media => {
        if (!live) {
          media.getTracks().forEach(track => track.stop())
          return
        }

        stream = media

        if (videoRef.current) {
          videoRef.current.srcObject = media
          videoRef.current.play()
        }

        frame = requestAnimationFrame(scan)
      })
      .catch(() => {
        setError('No camera access. Allow it in your browser settings, or type the code instead.')
      })

    return () => {
      live = false
      cancelAnimationFrame(frame)
      if (stream) stream.getTracks().forEach(track => track.stop())
    }
  }, [onFound])

  return (
    <Card>
      <h2>Scan the code</h2>

      {error ? (
        <p className="error" role="alert">{error}</p>
      ) : (
        <>
          <div className="scanner">
            <video ref={videoRef} playsInline muted />
            <span className="scanner__frame" />
          </div>
          <p className="muted" style={{ marginTop: 12 }}>{hint}</p>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <Button block onClick={onClose}>Type the code instead</Button>
    </Card>
  )
}
