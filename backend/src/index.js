// Set development environment for Docker deployments to allow CORS from any origin
// Force development mode if not explicitly set to production
if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
  process.env.NODE_ENV = 'development';
}

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import csv from 'csv-parser';
import { createReadStream } from 'fs';
import { initDb, closeDb, getDb } from './db.js';
import { migrateSchema, migrateFromSqlite, getSqliteMigrationStatus } from './migration.js';
import redemptionsRouter from './routes/redemptions.js';
import importExportRouter from './routes/import-export.js';
import tripsRouter from './routes/trips.js';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to all routes
app.use(limiter);

// Configure CORS based on environment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://centsperpoint.com', 'https://www.centsperpoint.com']
    : true, // Allow all origins in development (Docker deployments use development mode)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow credentials (cookies, authorization headers, etc.)
};

console.log('🔧 CORS Configuration:', {
  nodeEnv: process.env.NODE_ENV,
  allowAllOrigins: process.env.NODE_ENV !== 'production'
});

app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Routes
app.use('/api/redemptions', redemptionsRouter);
app.use('/api/import-export', importExportRouter);
app.use('/api/trips', tripsRouter);

// Health check with basic database connectivity
app.get('/health', async (req, res) => {
  try {
    const pool = await getDb();
    // Just check if we can connect to the database
    await pool.query('SELECT 1');
    res.json({ 
      status: 'OK',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR',
      error: 'Database connection failed'
    });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize PostgreSQL database
    await initDb();
    
    // Get database pool
    const pool = await getDb();
    
    // Always run schema migration for all users
    console.log('🔄 Running schema migration...');
    await migrateSchema(pool);
    console.log('✅ Schema migration completed');
    
    // Only check for SQLite migration if explicitly enabled
    if (process.env.ENABLE_SQLITE_MIGRATION === 'true') {
      console.log('🔄 Checking for SQLite database...');
      await migrateFromSqlite(pool);
    } else {
      console.log('ℹ️  SQLite migration check disabled');
    }
    
    // Get migration status for logging
    const migrationStatus = getSqliteMigrationStatus();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Database: PostgreSQL`);
      if (process.env.ENABLE_SQLITE_MIGRATION === 'true') {
        console.log(`🔄 SQLite Migration: ${migrationStatus.status}`);
        if (migrationStatus.migratedCount) {
          console.log(`📈 Migrated: ${migrationStatus.migratedCount} redemptions`);
        }
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

// Start the server
startServer(); 