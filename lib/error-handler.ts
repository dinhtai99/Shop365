/**
 * Centralized error handling utility
 * Integrates with Sentry for error logging
 */

import * as Sentry from '@sentry/nextjs'

export interface AppError extends Error {
  statusCode?: number
  code?: string
  isOperational?: boolean
}

export class CustomError extends Error implements AppError {
  statusCode: number
  code: string
  isOperational: boolean

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export function handleError(error: unknown, context?: Record<string, any>): AppError {
  // Log to Sentry in production
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: {
        component: context?.component || 'unknown',
      },
      extra: context,
    })
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error)
    if (context) {
      console.error('Context:', context)
    }
  }

  // Return standardized error
  if (error instanceof CustomError) {
    return error
  }

  if (error instanceof Error) {
    return {
      ...error,
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      isOperational: false,
    }
  }

  return new CustomError('An unknown error occurred', 500, 'UNKNOWN_ERROR')
}

export function createError(message: string, statusCode: number = 500, code?: string): CustomError {
  return new CustomError(message, statusCode, code)
}
