import type { TokenStore } from './TokenStore'

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly tokens: TokenStore,
  ) {}

  get<T>(path: string): Promise<T> {
    return this.send<T>('GET', path)
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.send<T>('POST', path, body)
  }

  private async send<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await this.fetchOrFail(method, path, body)
    const payload = await this.readBody(response)

    if (!response.ok) {
      throw new ApiError(response.status, this.messageFrom(payload, response.status))
    }

    return payload as T
  }

  private async fetchOrFail(method: string, path: string, body?: unknown): Promise<Response> {
    try {
      return await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: this.headersFor(body),
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    } catch {
      throw new ApiError(0, `Cannot reach the server at ${this.baseUrl}. Is the API running?`)
    }
  }

  private headersFor(body?: unknown): Record<string, string> {
    const headers: Record<string, string> = {}
    const token = this.tokens.read()

    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (token) headers.Authorization = `Bearer ${token}`

    return headers
  }

  private async readBody(response: Response): Promise<unknown> {
    const text = await response.text()

    if (!text) return null

    try {
      return JSON.parse(text)
    } catch {
      return { error: text }
    }
  }

  private messageFrom(payload: unknown, status: number): string {
    const message = (payload as { error?: string } | null)?.error
    return message ?? `Request failed (${status})`
  }
}
