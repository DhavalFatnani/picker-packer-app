import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database';
import { ErrorCode } from '@pp/shared';
import { AppError } from '../middleware/error';

const router = express.Router();

/**
 * POST /api/exceptions
 * Create an exception
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    const { type, task_id, sku_id, lock_tag_id, bin_id, description, photos, quantity, old_tag, new_tag } = req.body;

    if (!userId || !type || !description) {
      throw new AppError(ErrorCode.MissingRequiredField, 400);
    }

    const db = getDatabase();
    const exceptionId = uuidv4();

    db.prepare(`
      INSERT INTO exceptions (id, type, status, user_id, task_id, sku_id, lock_tag_id, bin_id, description, photos, quantity, old_tag, new_tag, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      exceptionId,
      type,
      'Pending',
      userId,
      task_id || null,
      sku_id || null,
      lock_tag_id || null,
      bin_id || null,
      description,
      photos ? JSON.stringify(photos) : null,
      quantity || null,
      old_tag || null,
      new_tag || null,
      new Date().toISOString()
    );

    const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(exceptionId) as any;

    res.json({
      success: true,
      data: {
        ...exception,
        photos: exception.photos ? JSON.parse(exception.photos) : [],
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/exceptions
 * List exceptions
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    const { status, type } = req.query;

    if (!userId) {
      throw new AppError(ErrorCode.Unauthorized, 401);
    }

    const db = getDatabase();
    let query = 'SELECT * FROM exceptions WHERE user_id = ?';
    const params: any[] = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const exceptions = db.prepare(query).all(...params).map((ex: any) => ({
      ...ex,
      photos: ex.photos ? JSON.parse(ex.photos) : [],
    }));

    res.json({
      success: true,
      data: {
        data: exceptions,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as exceptionRoutes };
