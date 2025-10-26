/**
 * Application configuration
 * Loads environment variables with defaults
 */

export interface Config {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
  dbPath: string;
  geoFence: {
    enabled: boolean;
    radiusMeters: number;
    warehouseLocation: {
      latitude: number;
      longitude: number;
    };
  };
  security: {
    bcryptRounds: number;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };
  cors: {
    origins: string[];
  };
}

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): Config {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    dbPath: process.env.DB_PATH || './data/pickerpacker.db',
    geoFence: {
      enabled: process.env.GEO_FENCE_ENABLED === 'true',
      radiusMeters: parseInt(process.env.GEO_FENCE_RADIUS_METERS || '1000', 10),
      warehouseLocation: {
        latitude: parseFloat(process.env.WAREHOUSE_LATITUDE || '37.7749'),
        longitude: parseFloat(process.env.WAREHOUSE_LONGITUDE || '-122.4194'),
      },
    },
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
    cors: {
      origins: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:19006', 'http://localhost:5173', 'http://localhost:5174'],
    },
  };
}

// Export singleton config instance
export const config = loadConfig();
