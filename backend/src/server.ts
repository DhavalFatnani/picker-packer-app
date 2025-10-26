import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { dbManager } from './db/database';
import { seedDatabase } from './db/seed';
import { seedRoutes } from './routes/seed';
import { authRoutes } from './routes/auth';
import { shiftRoutes } from './routes/shifts';
import { taskRoutes } from './routes/tasks';
import { orderRoutes } from './routes/orders';
import { exceptionRoutes } from './routes/exceptions';
import { adminRoutes } from './routes/admin';
import { authenticateToken } from './middleware/auth';
import { errorHandler } from './middleware/error';

/**
 * Initialize and start the Express server
 */
async function startServer(): Promise<void> {
  try {
    // Initialize database
    dbManager.initialize();
    await dbManager.initSchema();

    // Check if database needs seeding
    const db = dbManager.getDatabase();
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    
    if (userCount.count === 0) {
      console.log('Empty database detected, seeding...');
      await seedDatabase();
    }

    // Create Express app
    const app = express();

    // Middleware
    app.use(helmet({
      contentSecurityPolicy: false, // Disable CSP for development
    }));
    app.use(cors({
      origin: config.cors.origins,
      credentials: true,
    }));
    app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Root endpoint
    app.get('/', (_req, res) => {
      res.json({
        name: 'PickerPacker API',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          api: {
            auth: '/api/auth',
            seed: '/api/seed',
          },
        },
      });
    });

    // Health check endpoint
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Routes
    app.use('/api/seed', seedRoutes);
    app.use('/api/auth', authRoutes);
    
    // Protected routes (require authentication)
    app.use('/api/shifts', authenticateToken, shiftRoutes);
    app.use('/api/tasks', authenticateToken, taskRoutes);
    app.use('/api/orders', authenticateToken, orderRoutes);
    app.use('/api/exceptions', authenticateToken, exceptionRoutes);
    app.use('/api/admin', authenticateToken, adminRoutes);

    // Error handler (must be last)
    app.use(errorHandler);

    // Start server
    const port = config.port;
    app.listen(port, () => {
      console.log(`✓ Server running on http://localhost:${port}`);
      console.log(`✓ Environment: ${config.nodeEnv}`);
      console.log(`✓ Health check: http://localhost:${port}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n✓ Shutting down gracefully...');
  dbManager.close();
  process.exit(0);
});
