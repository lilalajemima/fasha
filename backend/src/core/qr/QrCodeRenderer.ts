import QRCode from 'qrcode'

export class QrCodeRenderer {
  toSvg(payload: string): Promise<string> {
    return QRCode.toString(payload, { type: 'svg', margin: 1, width: 240 })
  }
}
