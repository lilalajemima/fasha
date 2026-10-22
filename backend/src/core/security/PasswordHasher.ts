import bcrypt from 'bcrypt'

export class PasswordHasher {
  private readonly saltRounds = 12

  hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.saltRounds)
  }

  matches(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash)
  }
}
