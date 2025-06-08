// Set production environment for Docker deployments
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { initDb, closeDb, getDb } from './db.js';
import { autoMigrate, isMigrationComplete, getMigrationStatus } from './migration.js';
import redemptionsRouter from './routes/redemptions.js';
import importExportRouter from './routes/import-export.js';

// Export the Express app for testing purposes
const app = express();
export { app };
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 5000 : 5001);

// Configure CORS based on environment
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Development origins
    const developmentOrigins = [
      'http://localhost:5173', 
      'http://localhost:5174'
    ];
    
    // Production/Docker origins - allow any origin for Docker deployments
    // In production Docker, the frontend will be served from the same host
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // In Docker deployment, allow all origins since we can't predict the domain
      callback(null, true);
    } else {
      // In development, restrict to specific origins
      if (developmentOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Increase JSON payload limit for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Routes
app.use('/api/redemptions', redemptionsRouter);
app.use('/api/import-export', importExportRouter);

// Health check with detailed migration status
app.get('/health', (req, res) => {
  const migrationStatus = getMigrationStatus();
  res.json({ 
    status: 'OK', 
    database: 'PostgreSQL',
    migration: migrationStatus
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize PostgreSQL database
    await initDb();
    console.log('✅ PostgreSQL database initialized');
    
    // Run automatic migration if needed
    const pool = await getDb();
    await autoMigrate(pool);
    console.log('✅ Migration check completed');
    
    const migrationStatus = getMigrationStatus();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Database: PostgreSQL`);
      console.log(`🔄 Migration: ${migrationStatus.status}`);
      if (migrationStatus.migratedCount) {
        console.log(`📈 Migrated: ${migrationStatus.migratedCount} redemptions`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await closeDb();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await closeDb();
  process.exit(0);
});

export { startServer };

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
