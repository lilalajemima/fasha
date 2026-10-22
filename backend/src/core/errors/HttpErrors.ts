import { AppError } from './AppError'

export class BadRequestError extends AppError {
  readonly statusCode = 400
}

export class UnauthorisedError extends AppError {
  readonly statusCode = 401

  constructor(message = 'Sign in to continue') {
    super(message)
  }
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403

  constructor(message = 'This account may not do that') {
    super(message)
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404
}

export class ConflictError extends AppError {
  readonly statusCode = 409
}
