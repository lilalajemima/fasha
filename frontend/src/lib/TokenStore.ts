export class TokenStore {
  private readonly key: string

  constructor(key: string) {
    this.key = key
  }

  read(): string | null {
    return localStorage.getItem(this.key)
  }

  save(token: string): void {
    localStorage.setItem(this.key, token)
  }

  clear(): void {
    localStorage.removeItem(this.key)
  }
}
