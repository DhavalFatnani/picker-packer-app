import express from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../db/database';
import { config } from '../config';
import { Validation } from '@pp/shared';
import { ErrorCode } from '@pp/shared';
import { AppError } from '../middleware/error';
import type { SignupRequest, LoginRequest, AuthStatusResponse } from '@pp/shared';

const router = express.Router();

/**
 * Generate employee ID for new user
 */
function generateEmployeeId(warehouse: string): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `PP-${warehouse}-${randomNum}`;
}

/**
 * Generate a random 6-digit PIN
 */
function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/signup
 * Sign up a new user
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { name, phone }: SignupRequest = req.body;

    // Validate input
    if (!Validation.isName(name)) {
      throw new AppError(ErrorCode.InvalidInput, 400);
    }
    if (!Validation.isPhone(phone)) {
      throw new AppError(ErrorCode.InvalidPhone, 400);
    }

    const db = getDatabase();
    const sanitizedPhone = Validation.sanitizePhone(phone);

    // Check if phone already exists
    const existingUser = db.prepare('SELECT id, status FROM users WHERE phone = ?').get(sanitizedPhone) as any;

    // Generate random PIN
    const randomPin = generatePin();
    const pinHash = await bcrypt.hash(randomPin, config.security.bcryptRounds);
    const now = new Date().toISOString();

    let userId: string;
    let employeeId: string;
    let message: string;

    if (existingUser) {
      // User exists - check status
      if (existingUser.status === 'Rejected') {
        // Allow re-signup for rejected users - update existing record
        userId = existingUser.id;
        employeeId = generateEmployeeId('WH1');
        
        db.prepare(`
          UPDATE users 
          SET name = ?, pin_hash = ?, status = 'Pending', updated_at = ?, approved_at = NULL, approved_by = NULL
          WHERE id = ?
        `).run(name, pinHash, now, userId);

        message = 'Account re-submitted for approval. Please wait for ASM approval. Save your new PIN securely!';
      } else if (existingUser.status === 'Approved' || existingUser.status === 'Active') {
        // Already approved - cannot re-signup
        throw new AppError(ErrorCode.InvalidInput, 400, { 
          message: 'This phone number is already registered and approved. Please login instead.' 
        });
      } else {
        // Pending status - already awaiting approval
        throw new AppError(ErrorCode.InvalidInput, 400, { 
          message: 'An account with this phone number is already pending approval. Please wait for ASM approval or contact support.' 
        });
      }
    } else {
      // New user - create account
      userId = uuidv4();
      employeeId = generateEmployeeId('WH1');

      db.prepare(`
        INSERT INTO users (id, employee_id, name, phone, pin_hash, role, status, warehouse, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        employeeId,
        name,
        sanitizedPhone,
        pinHash,
        'PickerPacker',
        'Pending',
        'WH1',
        now,
        now
      );

      message = 'Account created successfully. Please wait for ASM approval. Save your PIN securely!';
    }

    res.json({
      success: true,
      data: {
        user_id: userId,
        employee_id: employeeId,
        pin: randomPin, // Return PIN to user (only time it's exposed)
        status: 'Pending',
        message,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login with phone and PIN
 */
router.post('/login', async (req, res, next) => {
  try {
    const { phone, pin }: LoginRequest = req.body;

    if (!phone || !pin) {
      throw new AppError(ErrorCode.MissingRequiredField, 400);
    }

    const db = getDatabase();
    const sanitizedPhone = Validation.sanitizePhone(phone);

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(sanitizedPhone) as any;
    
    if (!user) {
      throw new AppError(ErrorCode.InvalidCredentials, 401);
    }

    // Check if user is approved
    if (user.status !== 'Approved' && user.status !== 'Active') {
      throw new AppError(ErrorCode.PendingASMApproval, 403);
    }

    // Verify PIN
    const isPinValid = await bcrypt.compare(pin, user.pin_hash);
    if (!isPinValid) {
      throw new AppError(ErrorCode.InvalidCredentials, 401);
    }

    // Generate JWT tokens
    const tokenPayload = {
      userId: user.id,
      employee_id: user.employee_id,
      role: user.role,
      warehouse: user.warehouse,
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(tokenPayload, config.jwtSecret, {
      expiresIn: config.jwtRefreshExpiresIn,
    } as jwt.SignOptions);

    res.json({
      success: true,
      data: {
        token,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          employee_id: user.employee_id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          status: user.status,
          warehouse: user.warehouse,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/status
 * Get current user status (requires auth middleware)
 */
router.get('/status', async (req, res, next) => {
  try {
    // TODO: Add auth middleware to extract user from JWT
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(ErrorCode.Unauthorized, 401);
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      
      const db = getDatabase();
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId) as any;
      
      if (!user) {
        throw new AppError(ErrorCode.Unauthorized, 401);
      }

      const response: AuthStatusResponse = {
        user: {
          id: user.id,
          employee_id: user.employee_id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          status: user.status,
          warehouse: user.warehouse,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        is_authenticated: true,
      };

      res.json({
        success: true,
        data: response,
      });
    } catch (jwtError) {
      throw new AppError(ErrorCode.TokenExpired, 401);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/request-otp
 * Request OTP for PIN reset
 */
router.post('/request-otp', async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      throw new AppError(ErrorCode.MissingRequiredField, 400);
    }

    const db = getDatabase();
    const sanitizedPhone = Validation.sanitizePhone(phone);

    console.log('Request OTP for phone:', sanitizedPhone);

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(sanitizedPhone) as any;
    
    if (!user) {
      console.log('User not found for phone:', sanitizedPhone);
      throw new AppError(ErrorCode.InvalidPhone, 404);
    }

    // Generate 6-digit OTP (for development, in production send via SMS)
    const otp = generatePin(); // Reusing PIN generator for OTP
    
    console.log('Generated OTP:', otp);

    try {
      // Store OTP in database (in production, use Redis with TTL)
      // For development, store in users table temporarily
      db.prepare('UPDATE users SET otp = ?, otp_expires_at = ? WHERE phone = ?').run(
        otp,
        new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes expiry
        sanitizedPhone
      );
      console.log('OTP stored successfully');
    } catch (dbError: any) {
      console.error('Database error storing OTP:', dbError.message);
      console.error('Full error:', dbError);
      throw new AppError(ErrorCode.UnexpectedError, 500, { 
        message: `Database error: ${dbError.message}` 
      });
    }

    res.json({
      success: true,
      data: {
        otp, // In production, don't send OTP in response - send via SMS
        expires_in: 300, // 5 minutes in seconds
        message: 'OTP sent successfully (demo mode - OTP shown for testing)',
      },
    });
  } catch (error) {
    console.error('Error in request-otp:', error);
    next(error);
  }
});

/**
 * POST /api/auth/verify-otp-and-reset-pin
 * Verify OTP and reset PIN
 */
router.post('/verify-otp-and-reset-pin', async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      throw new AppError(ErrorCode.MissingRequiredField, 400);
    }

    const db = getDatabase();
    const sanitizedPhone = Validation.sanitizePhone(phone);

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(sanitizedPhone) as any;
    
    if (!user) {
      throw new AppError(ErrorCode.InvalidPhone, 404);
    }

    // Check if OTP exists and is valid
    if (!user.otp) {
      throw new AppError(ErrorCode.InvalidCredentials, 400, { message: 'No OTP found. Please request a new OTP.' });
    }

    if (user.otp_expires_at && new Date(user.otp_expires_at) < new Date()) {
      throw new AppError(ErrorCode.InvalidCredentials, 400, { message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otp !== otp) {
      throw new AppError(ErrorCode.InvalidCredentials, 400, { message: 'Invalid OTP. Please try again.' });
    }

    // Generate new PIN
    const newPin = generatePin();
    const pinHash = await bcrypt.hash(newPin, config.security.bcryptRounds);

    // Update user PIN and clear OTP
    db.prepare('UPDATE users SET pin_hash = ?, otp = NULL, otp_expires_at = NULL, updated_at = ? WHERE phone = ?').run(
      pinHash,
      new Date().toISOString(),
      sanitizedPhone
    );

    res.json({
      success: true,
      data: {
        pin: newPin,
        message: 'PIN reset successfully. Please save your new PIN securely.',
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };
