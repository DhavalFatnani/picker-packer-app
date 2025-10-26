import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database';
import { ErrorCode } from '@pp/shared';
import { AppError } from '../middleware/error';

const router = express.Router();

/**
 * GET /api/tasks
 * List tasks for current user
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    const { status, type, page = 1, limit = 20 } = req.query;

    if (!userId) {
      throw new AppError(ErrorCode.Unauthorized, 401);
    }

    const db = getDatabase();
    let query = 'SELECT * FROM tasks WHERE assigned_to = ?';
    const params: any[] = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const tasks = db.prepare(query).all(...params);

    // Get task items for each task
    const tasksWithItems = tasks.map((task: any) => {
      const items = db.prepare('SELECT * FROM task_items WHERE task_id = ?').all(task.id);
      return {
        ...task,
        items,
      };
    });

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM tasks WHERE assigned_to = ?';
    const countParams: any[] = [userId];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (type) {
      countQuery += ' AND type = ?';
      countParams.push(type);
    }

    const total = (db.prepare(countQuery).get(...countParams) as { total: number }).total;

    res.json({
      success: true,
      data: {
        data: tasksWithItems,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          total_pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tasks/packing-queue
 * Get packing queue (orders with status 'Picked' that are ready to be packed)
 */
router.get('/packing-queue', async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      throw new AppError(ErrorCode.Unauthorized, 401);
    }

    const db = getDatabase();

    // Get orders with status 'Picked' assigned to the current user
    const orders = db
      .prepare('SELECT * FROM orders WHERE assigned_to = ? AND status = ? ORDER BY picked_at ASC')
      .all(userId, 'Picked');

    // Get order items for each order
    const ordersWithItems = orders.map((order: any) => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return {
        ...order,
        items,
      };
    });

    res.json({
      success: true,
      data: ordersWithItems,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tasks/picking
 * Get picking tasks (all pick tasks for mobile app)
 */
router.get('/picking', async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw new AppError(ErrorCode.Unauthorized, 401);
    }

    const db = getDatabase();

    // Get all pick tasks assigned to user that are not completed
    const pickTasks = db
      .prepare('SELECT * FROM tasks WHERE type = ? AND assigned_to = ? AND status != ? ORDER BY created_at DESC')
      .all('Pick', userId, 'Completed');

    // Get task items for each task
    const tasksWithItems = pickTasks.map((task: any) => {
      const items = db.prepare('SELECT * FROM task_items WHERE task_id = ?').all(task.id);
      return {
        ...task,
        items,
      };
    });

    res.json({
      success: true,
      data: tasksWithItems,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tasks/:id
 * Get task details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new AppError(ErrorCode.Unauthorized, 401);
    }

    const db = getDatabase();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND assigned_to = ?').get(id, userId);

    if (!task) {
      throw new AppError(ErrorCode.TaskNotFound, 404);
    }

    const items = db.prepare('SELECT * FROM task_items WHERE task_id = ?').all(id) as any[];

    // Get lock tags for each item
    const itemsWithLockTags = items.map((item: any) => {
      const lockTags = db
        .prepare('SELECT * FROM task_item_lock_tags WHERE task_item_id = ?')
        .all(item.id) as any[];
      return {
        ...item,
        lock_tags: lockTags,
      };
    });

    res.json({
      success: true,
      data: {
        ...task,
        items: itemsWithLockTags,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tasks/:id/scan
 * Scan an item for a task
 */
router.post('/:id/scan', async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const { barcode, lock_tag } = req.body;

    if (!userId) {
      throw new AppError(ErrorCode.Unauthorized, 401);
    }

    if (!barcode || !lock_tag) {
      throw new AppError(ErrorCode.MissingRequiredField, 400);
    }

    const db = getDatabase();

    // Get task and verify assignment
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND assigned_to = ?').get(id, userId);

    if (!task) {
      throw new AppError(ErrorCode.TaskNotFound, 404);
    }

    // Find the lock tag in the task_item_lock_tags table
    const lockTagEntry = db
      .prepare(`
        SELECT tilt.*, ti.sku_code, ti.quantity, ti.quantity_scanned 
        FROM task_item_lock_tags tilt
        JOIN task_items ti ON tilt.task_item_id = ti.id
        WHERE ti.task_id = ? AND tilt.lock_tag_code = ?
      `)
      .get(id, lock_tag) as any;

    if (!lockTagEntry) {
      res.json({
        success: true,
        data: {
          matched: false,
          message: 'Lock tag not found in this task',
        },
      });
      return;
    }

    // Mark the lock tag as scanned
    db.prepare('UPDATE task_item_lock_tags SET scanned = 1 WHERE id = ?').run(lockTagEntry.id);

    // Update scanned quantity in task_items
    const newScannedQuantity = Math.min(
      lockTagEntry.quantity_scanned + 1,
      lockTagEntry.quantity
    );

    db.prepare('UPDATE task_items SET quantity_scanned = ? WHERE id = ?').run(
      newScannedQuantity,
      lockTagEntry.task_item_id
    );

    // Check if item is complete
    if (newScannedQuantity >= lockTagEntry.quantity) {
      db.prepare('UPDATE task_items SET status = ? WHERE id = ?').run('Completed', lockTagEntry.task_item_id);
    }

    res.json({
      success: true,
      data: {
        matched: true,
        task_id: id,
        item_id: lockTagEntry.task_item_id,
        sku: lockTagEntry.sku_code,
        action: 'scanned',
        message: `Scanned ${newScannedQuantity}/${lockTagEntry.quantity}`,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tasks/:id/complete
 * Mark task as complete
 */
router.post('/:id/complete', async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new AppError(ErrorCode.Unauthorized, 401);
    }

    const db = getDatabase();

    // Get task and verify assignment
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND assigned_to = ?').get(id, userId);

    if (!task) {
      throw new AppError(ErrorCode.TaskNotFound, 404);
    }

    if ((task as any).status === 'Completed') {
      throw new AppError(ErrorCode.TaskAlreadyCompleted, 400);
    }

    const taskData = task as any;

    // Update task status
    db.prepare('UPDATE tasks SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?').run(
      'Completed',
      new Date().toISOString(),
      new Date().toISOString(),
      id
    );

    // If it's a pick task, update the order status to 'Picked' (ready for packing)
    if (taskData.type === 'Pick') {
      const now = new Date().toISOString();

      // Update order status to 'Picked' - order is now ready for packing
      const order = db.prepare('SELECT id, order_number FROM orders WHERE task_id = ?').get(id) as any;
      
      console.log(`Looking for order with task_id = ${id}`);
      if (order) {
        console.log(`Found order: ${order.order_number} (${order.id})`);
        
        // Update order status to 'Picked' and update order items status
        db.prepare('UPDATE orders SET status = ?, picked_at = ?, updated_at = ? WHERE id = ?').run(
          'Picked',
          now,
          now,
          order.id
        );
        
        // Update order items status to 'Picked'
        db.prepare('UPDATE order_items SET status = ? WHERE order_id = ?').run('Picked', order.id);
        
        console.log(`✓ Updated order ${order.order_number} (${order.id}) status to 'Picked' - Ready for packing`);
      } else {
        console.log(`No order found with task_id = ${id}`);
      }
    }

    // Get updated task with items
    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    const items = db.prepare('SELECT * FROM task_items WHERE task_id = ?').all(id);

    res.json({
      success: true,
      data: {
        ...updatedTask,
        items,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as taskRoutes };
