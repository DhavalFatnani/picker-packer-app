import express from 'express';
import { getDatabase } from '../db/database';
import { ErrorCode } from '@pp/shared';
import { AppError } from '../middleware/error';

const router = express.Router();

/**
 * GET /api/orders
 * List orders for current user
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    const { status } = req.query;

    if (!userId) {
      throw new AppError(ErrorCode.Unauthorized, 401);
    }

    const db = getDatabase();
    let query = 'SELECT * FROM orders WHERE assigned_to = ?';
    const params: any[] = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const orders = db.prepare(query).all(...params);

    // Get order items and task details for each order
    const ordersWithItems = orders.map((order: any) => {
      // Get order items
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      
      // Get task details if task_id exists
      let task = null;
      if (order.task_id) {
        task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(order.task_id);
        
        // Get task items if task exists
        if (task) {
          const taskItems = db.prepare('SELECT * FROM task_items WHERE task_id = ?').all(task.id);
          task.items = taskItems;
        }
      }
      
      return {
        ...order,
        items,
        task,
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
 * GET /api/orders/:id
 * Get order details with task information
 */
router.get('/:id', async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new AppError(ErrorCode.Unauthorized, 401);
    }

    const db = getDatabase();
    
    // Get order
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND assigned_to = ?').get(id, userId);
    
    if (!order) {
      throw new AppError(ErrorCode.NotFound, 404, 'Order not found');
    }
    
    // Get order items
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    
    // Get task details if task_id exists
    let task = null;
    if (order.task_id) {
      task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(order.task_id);
      
      // Get task items if task exists
      if (task) {
        const taskItems = db.prepare('SELECT * FROM task_items WHERE task_id = ?').all(task.id);
        task.items = taskItems;
      }
    }
    
    res.json({
      success: true,
      data: {
        ...order,
        items,
        task,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as orderRoutes };
