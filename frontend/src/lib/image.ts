/**
 * Pictures are resized in the browser before they are sent, so what reaches
 * the database is a square thumbnail of about 20KB rather than whatever came
 * off a phone camera. The server refuses anything larger than 150KB, which
 * this stays well inside.
 */

const SIZE = 256
const MAX_CHARS = 200_000

export class ImageTooLarge extends Error {
  constructor() {
    super('That picture could not be made small enough. Try a different one.')
  }
}

/** Centre-crops to a square, scales to 256px, and returns a data URL. */
export async function toSquareDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')

  canvas.width = SIZE
  canvas.height = SIZE

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('This browser cannot resize the picture')
  }

  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  )
  bitmap.close()

  // A logo with transparency keeps it; a photograph is far smaller as JPEG.
  const candidates =
    file.type === 'image/png'
      ? [canvas.toDataURL('image/png'), canvas.toDataURL('image/jpeg', 0.82)]
      : [canvas.toDataURL('image/jpeg', 0.82), canvas.toDataURL('image/jpeg', 0.6)]

  const chosen = candidates.find(candidate => candidate.length <= MAX_CHARS)

  if (!chosen) {
    throw new ImageTooLarge()
  }

  return chosen
}
