import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ErrorCode } from '@pp/shared';
import { AppError } from './error';

/**
 * JWT payload structure
 */
interface JWTPayload {
  userId: string;
  employee_id: string;
  role: string;
  warehouse: string;
}

/**
 * Extend Express Request to include user
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export function authenticateToken(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(ErrorCode.Unauthorized, 401));
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError(ErrorCode.TokenExpired, 401));
  }
}

/**
 * Role-based access control middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(ErrorCode.Unauthorized, 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(ErrorCode.Unauthorized, 403));
    }

    next();
  };
}
