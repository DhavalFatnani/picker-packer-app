import express from 'express';
import { seedDatabase } from '../db/seed';

const router = express.Router();

/**
 * Seed database with mock data (development only)
 */
router.post('/', async (_req, res, next) => {
  try {
    await seedDatabase();
    res.json({
      success: true,
      data: { message: 'Database seeded successfully' },
    });
  } catch (error) {
    next(error);
  }
});

export { router as seedRoutes };
