import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export class TotpService {
  private readonly stepSeconds = 30
  private readonly digits = 6
  private readonly driftSteps = 1

  createSecret(): string {
    return randomBytes(20).toString('hex')
  }

  generate(secret: string, at: Date): string {
    return this.codeFor(secret, this.counterFor(at))
  }

  verify(secret: string, code: string, at: Date): boolean {
    const counter = this.counterFor(at)

    for (let drift = -this.driftSteps; drift <= this.driftSteps; drift += 1) {
      if (this.matches(code, this.codeFor(secret, counter + drift))) {
        return true
      }
    }

    return false
  }

  secondsRemaining(at: Date): number {
    return this.stepSeconds - (Math.floor(at.getTime() / 1000) % this.stepSeconds)
  }

  private counterFor(at: Date): number {
    return Math.floor(at.getTime() / 1000 / this.stepSeconds)
  }

  private codeFor(secret: string, counter: number): string {
    const message = Buffer.alloc(8)
    message.writeBigUInt64BE(BigInt(counter))

    const digest = createHmac('sha1', Buffer.from(secret, 'hex')).update(message).digest()
    const offset = digest[digest.length - 1] & 0x0f
    const truncated = digest.readUInt32BE(offset) & 0x7fffffff

    return String(truncated % 10 ** this.digits).padStart(this.digits, '0')
  }

  private matches(given: string, expected: string): boolean {
    if (given.length !== expected.length) {
      return false
    }

    return timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  }
}
