import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { config } from '../config';
import * as fs from 'fs';

/**
 * Database singleton class for SQLite connection management
 */
class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database.Database | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize database connection
   */
  initialize(): void {
    if (this.db) {
      return;
    }

    // Create data directory if it doesn't exist
    const dataDir = dirname(config.dbPath);
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    // Open database connection
    this.db = new Database(config.dbPath);
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
    this.db.pragma('foreign_keys = ON'); // Enable foreign key constraints

    console.log(`✓ Database connected: ${config.dbPath}`);
  }

  /**
   * Get database instance
   */
  getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('✓ Database connection closed');
    }
  }

  /**
   * Execute database initialization (create tables)
   */
  async initSchema(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const schemaPath = `${__dirname}/schema.sql`;
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Execute schema SQL
      this.db.exec(schema);
      console.log('✓ Database schema initialized');
      
      // Run migrations for existing databases
      this.runMigrations();
    } catch (error) {
      console.error('Error initializing schema:', error);
      throw error;
    }
  }

  /**
   * Run database migrations for existing databases
   */
  runMigrations(): void {
    if (!this.db) return;

    try {
      // Check if users table exists
      const tableInfo = this.db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='users'
      `).get() as any;

      if (!tableInfo) {
        return; // No users table, schema will be created fresh
      }

      // Check if otp columns exist
      const columns = this.db.prepare(`PRAGMA table_info(users)`).all() as any[];
      const hasOtp = columns.some((col: any) => col.name === 'otp');

      if (!hasOtp) {
        console.log('🔄 Adding OTP columns to users table...');
        this.db.exec(`
          ALTER TABLE users ADD COLUMN otp TEXT;
          ALTER TABLE users ADD COLUMN otp_expires_at TEXT;
        `);
        console.log('✓ OTP columns added successfully');
      }
    } catch (error) {
      // Migration failed, but don't throw - schema might already be updated
      console.error('Migration warning:', error);
    }
  }

  /**
   * Run a database transaction
   */
  transaction<T>(fn: () => T): T {
    const db = this.getDatabase();
    const transaction = db.transaction(fn);
    return transaction();
  }
}

// Export singleton instance
export const dbManager = DatabaseManager.getInstance();

// Export convenience function to get database
export function getDatabase(): Database.Database {
  return dbManager.getDatabase();
}
