import { Request, Response, NextFunction } from 'express';
import { ErrorCode, getErrorMessage } from '@pp/shared';

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public errorCode: ErrorCode,
    public statusCode: number,
    public details?: Record<string, unknown>
  ) {
    super(getErrorMessage(errorCode));
    this.name = 'AppError';
  }
}

/**
 * Centralized error handling middleware
 */
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // If response already sent, delegate to default handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle AppError (known errors)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        error_code: err.errorCode,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Handle validation errors (Joi)
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: {
        error_code: 'ERR_050',
        message: 'Validation failed',
        details: { validation: err.message },
      },
    });
    return;
  }

  // Handle unexpected errors
  console.error('Unexpected error:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({
    success: false,
    error: {
      error_code: 'ERR_090',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' 
        ? { 
            stack: err.stack,
            message: err.message,
            name: err.name
          } 
        : undefined,
    },
  });
}
