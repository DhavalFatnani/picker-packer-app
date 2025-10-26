import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database';
import { ErrorCode } from '@pp/shared';
import { AppError } from '../middleware/error';

const router = express.Router();

/**
 * GET /api/admin/users
 * Get all users (for admin/ASM dashboard)
 */
router.get('/users', async (_req, res, next) => {
  try {
    const db = getDatabase();
    const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();

    res.json({
      success: true,
      data: users.map((u: any) => {
        const { pin_hash, ...user } = u;
        return user;
      }),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/pending-approvals
 * Get list of users pending approval
 */
router.get('/pending-approvals', async (_req, res, next) => {
  try {
    const db = getDatabase();
    const users = db.prepare('SELECT * FROM users WHERE status = ? ORDER BY created_at DESC').all('Pending');

    res.json({
      success: true,
      data: users.map((u: any) => {
        const { pin_hash, ...user } = u;
        return user;
      }),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/approve/:id
 * Approve or reject a user
 */
router.post('/approve/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.query;

    if (action !== 'approve' && action !== 'reject') {
      throw new AppError(ErrorCode.InvalidInput, 400);
    }

    const db = getDatabase();

    if (action === 'approve') {
      db.prepare('UPDATE users SET status = ?, approved_at = ?, updated_at = ? WHERE id = ?').run(
        'Approved',
        new Date().toISOString(),
        new Date().toISOString(),
        id
      );
    } else {
      db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').run(
        'Rejected',
        new Date().toISOString(),
        id
      );
    }

    res.json({
      success: true,
      data: { success: true },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/announcements
 * Get active announcements
 */
router.get('/announcements', async (_req, res, next) => {
  try {
    const db = getDatabase();
    const announcements = db
      .prepare(
        'SELECT * FROM announcements WHERE expires_at IS NULL OR expires_at > datetime("now") ORDER BY created_at DESC'
      )
      .all();

    res.json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/announcements
 * Create an announcement
 */
router.post('/announcements', async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    const { title, message, priority, expires_at } = req.body;

    if (!userId || !title || !message) {
      throw new AppError(ErrorCode.MissingRequiredField, 400);
    }

    const db = getDatabase();
    const announcementId = uuidv4();

    db.prepare(`
      INSERT INTO announcements (id, title, message, priority, created_by, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      announcementId,
      title,
      message,
      priority || 'Normal',
      userId,
      expires_at || null,
      new Date().toISOString(),
      new Date().toISOString()
    );

    const announcement = db.prepare('SELECT * FROM announcements WHERE id = ?').get(announcementId);

    res.json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/geofence-settings
 * Get all geofence settings
 */
router.get('/geofence-settings', async (_req, res, next) => {
  try {
    const db = getDatabase();
    const settings = db.prepare('SELECT * FROM geofence_settings ORDER BY warehouse').all();

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/geofence-settings/:warehouse
 * Get geofence setting for a specific warehouse
 */
router.get('/geofence-settings/:warehouse', async (req, res, next) => {
  try {
    const { warehouse } = req.params;
    const db = getDatabase();
    
    const setting = db.prepare('SELECT * FROM geofence_settings WHERE warehouse = ?').get(warehouse);

    if (!setting) {
      throw new AppError(ErrorCode.TaskNotFound, 404);
    }

    res.json({
      success: true,
      data: setting,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/geofence-settings
 * Create or update geofence setting
 */
router.post('/geofence-settings', async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    const { warehouse, latitude, longitude, radius_meters, enabled } = req.body;

    if (!userId || !warehouse || latitude === undefined || longitude === undefined) {
      throw new AppError(ErrorCode.MissingRequiredField, 400);
    }

    const db = getDatabase();
    
    // Check if setting exists
    const existing = db.prepare('SELECT id FROM geofence_settings WHERE warehouse = ?').get(warehouse);

    const now = new Date().toISOString();

    if (existing) {
      // Update existing
      db.prepare(
        'UPDATE geofence_settings SET latitude = ?, longitude = ?, radius_meters = ?, enabled = ?, updated_by = ?, updated_at = ? WHERE warehouse = ?'
      ).run(
        latitude,
        longitude,
        radius_meters || 1000,
        enabled !== undefined ? (enabled ? 1 : 0) : 1,
        userId,
        now,
        warehouse
      );

      const updated = db.prepare('SELECT * FROM geofence_settings WHERE warehouse = ?').get(warehouse);

      res.json({
        success: true,
        data: updated,
      });
    } else {
      // Create new
      const id = uuidv4();
      
      db.prepare(
        'INSERT INTO geofence_settings (id, warehouse, latitude, longitude, radius_meters, enabled, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        id,
        warehouse,
        latitude,
        longitude,
        radius_meters || 1000,
        enabled !== undefined ? (enabled ? 1 : 0) : 1,
        userId,
        now,
        now
      );

      const created = db.prepare('SELECT * FROM geofence_settings WHERE id = ?').get(id);

      res.json({
        success: true,
        data: created,
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/geofence-settings/:warehouse
 * Delete geofence setting
 */
router.delete('/geofence-settings/:warehouse', async (req, res, next) => {
  try {
    const { warehouse } = req.params;
    const db = getDatabase();
    
    const existing = db.prepare('SELECT id FROM geofence_settings WHERE warehouse = ?').get(warehouse);
    
    if (!existing) {
      throw new AppError(ErrorCode.TaskNotFound, 404);
    }

    db.prepare('DELETE FROM geofence_settings WHERE warehouse = ?').run(warehouse);

    res.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    next(error);
  }
});

export { router as adminRoutes };
