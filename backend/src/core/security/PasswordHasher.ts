import bcrypt from 'bcrypt'

/**
 * What the services actually need. Depending on this rather than on the bcrypt
 * class is what lets a test run the rules without paying for twelve rounds of
 * hashing on every assertion.
 */
export interface Hasher {
  hash(plainText: string): Promise<string>
  matches(plainText: string, hash: string): Promise<boolean>
}

export class PasswordHasher implements Hasher {
  private readonly saltRounds = 12

  hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.saltRounds)
  }

  matches(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash)
  }
}
