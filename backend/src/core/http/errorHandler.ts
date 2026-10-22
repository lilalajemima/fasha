import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../errors/AppError'
import { NotFoundError } from '../errors/HttpErrors'
import { env } from '../config/env'

const PRISMA_UNIQUE_CONSTRAINT = 'P2002'

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new NotFoundError('No such endpoint'))
}

function isUniqueConstraintBreach(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === PRISMA_UNIQUE_CONSTRAINT
  )
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message })
    return
  }

  if (isUniqueConstraintBreach(error)) {
    res.status(409).json({ error: 'That record already exists' })
    return
  }

  console.error('Unhandled error:', error)
  res.status(500).json({
    error: 'Something went wrong on the server',
    ...(env.isProduction ? {} : { detail: String(error) }),
  })
}
