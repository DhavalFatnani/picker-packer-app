import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database';
import { config } from '../config';
import { ErrorCode } from '@pp/shared';
import { AppError } from '../middleware/error';
import type { StartShiftRequest } from '@pp/shared';

const router = express.Router();

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Validate geo-fence
 */
function validateGeofence(latitude: number, longitude: number, warehouse: string): boolean {
  const db = getDatabase();
  
  // Check if geofencing is enabled for this warehouse
  const geofenceSetting = db.prepare('SELECT * FROM geofence_settings WHERE warehouse = ?').get(warehouse);
  
  if (!geofenceSetting || !geofenceSetting.enabled) {
    // If no setting or disabled, allow shift start
    return true;
  }

  const distance = calculateDistance(
    latitude,
    longitude,
    geofenceSetting.latitude,
    geofenceSetting.longitude
  );

  return distance <= geofenceSetting.radius_meters;
}

/**
 * POST /api/shifts/start
 * Start a shift
 */
router.post('/start', async (req: express.Request, res: express.Response, next) => {
  try {
    const { warehouse, zone, gps, selfie_base64 } = req.body;
    const userId = (req as any).user?.userId; // From auth middleware

    console.log('Shift start request:', { warehouse, zone, gps, hasSelfie: !!selfie_base64 });

    if (!userId) {
      throw new AppError(ErrorCode.Unauthorized, 401);
    }

    if (!warehouse || !gps || !selfie_base64) {
      console.log('Missing fields:', { warehouse: !!warehouse, gps: !!gps, selfie_base64: !!selfie_base64 });
      throw new AppError(ErrorCode.MissingRequiredField, 400);
    }

    // Validate geo-fence
    console.log('Validating geofence for:', warehouse);
    const isValid = validateGeofence(gps.latitude, gps.longitude, warehouse);
    console.log('Geofence validation result:', isValid);
    
    if (!isValid) {
      throw new AppError(ErrorCode.OutsideGeofence, 403);
    }

    const db = getDatabase();

    // Check if user already has an active shift
    const activeShift = db
      .prepare('SELECT id FROM shifts WHERE user_id = ? AND status = ?')
      .get(userId, 'Active');

    if (activeShift) {
      throw new AppError(ErrorCode.ActiveShiftExists, 409);
    }

    // Create new shift
    const shiftId = uuidv4();
    const now = new Date().toISOString();

    // Store selfie URI (for now, we're storing base64 directly)
    // In production, upload to S3/storage and store URL
    const selfieUri = selfie_base64;
    
    console.log('Inserting shift with selfie length:', selfieUri?.length);

    try {
      db.prepare(`
        INSERT INTO shifts (id, user_id, status, warehouse, zone, started_at, selfie_uri, selfie_gps, geo_validated, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        shiftId,
        userId,
        'Active',
        warehouse,
        zone || null,
        now,
        selfieUri,
        JSON.stringify(gps),
        1,
        now
      );
      console.log('Shift inserted successfully');
    } catch (dbError: any) {
      console.error('Database error during shift insert:', dbError.message);
      console.error('Error details:', dbError);
      throw dbError;
    }

    const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(shiftId) as any;

    res.json({
      success: true,
      data: {
        shift_id: shiftId,
        shift: {
          ...shift,
          selfie_gps: JSON.parse(shift.selfie_gps || '{}'),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/shifts/active
 * Get active shift for current user
 */
router.get('/active', async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw new AppError(ErrorCode.Unauthorized, 401);
    }

    const db = getDatabase();

    // Find active shift
    const shift = db
      .prepare('SELECT * FROM shifts WHERE user_id = ? AND status = ?')
      .get(userId, 'Active') as any;

    if (!shift) {
      res.status(404).json({
        success: false,
        error: {
          code: ErrorCode.NotFound,
          message: 'No active shift found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ...shift,
        selfie_gps: JSON.parse(shift.selfie_gps || '{}'),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/shifts/end
 * End a shift
 */
router.post('/end', async (req, res, next) => {
  try {
    const { selfie_base64 } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw new AppError(ErrorCode.Unauthorized, 401);
    }

    if (!selfie_base64) {
      throw new AppError(ErrorCode.MissingRequiredField, 400);
    }

    const db = getDatabase();

    // Find active shift
    const shift = db
      .prepare('SELECT * FROM shifts WHERE user_id = ? AND status = ?')
      .get(userId, 'Active') as any;

    if (!shift) {
      throw new AppError(ErrorCode.ShiftNotStarted, 400);
    }

    // Calculate shift summary
    const startedAt = new Date(shift.started_at);
    const endedAt = new Date();
    const durationMinutes = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000 / 60);

    const tasksCompleted = db
      .prepare(
        'SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status = ? AND completed_at IS NOT NULL AND completed_at >= datetime(?)'
      )
      .get(userId, 'Completed', shift.started_at) as { count: number };

    const tasksPending = db
      .prepare(
        'SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status IN (?, ?, ?)'
      )
      .get(userId, 'Pending', 'Assigned', 'InProgress') as { count: number };

    const itemsScanned = db
      .prepare(
        'SELECT SUM(quantity_scanned) as total FROM task_items WHERE task_id IN (SELECT id FROM tasks WHERE assigned_to = ?)'
      )
      .get(userId) as { total: number };

    const throughput = itemsScanned.total / durationMinutes;

    // End shift and store end selfie
    db.prepare('UPDATE shifts SET status = ?, ended_at = ?, selfie_uri = ? WHERE id = ?').run(
      'Ended',
      endedAt.toISOString(),
      selfie_base64, // Store base64, or upload to storage and store URL
      shift.id
    );

    res.json({
      success: true,
      data: {
        shift: {
          ...shift,
          status: 'Ended',
          ended_at: endedAt.toISOString(),
        },
        summary: {
          shift_id: shift.id,
          user_id: userId,
          duration_minutes: durationMinutes,
          tasks_completed: tasksCompleted.count,
          tasks_pending: tasksPending.count,
          items_scanned: itemsScanned.total || 0,
          throughput: isNaN(throughput) ? 0 : throughput,
          exceptions_count: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as shiftRoutes };
