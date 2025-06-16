// Set production environment for Docker deployments
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

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
const PORT = process.env.PORT || 5001;

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
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

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
    
    // Optionally run SQLite migration if SQLite database is detected
    console.log('🔄 Checking for SQLite database...');
    await migrateFromSqlite(pool);
    
    // Get migration status for logging
    const migrationStatus = getSqliteMigrationStatus();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Database: PostgreSQL`);
      console.log(`🔄 SQLite Migration: ${migrationStatus.status}`);
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

// Start the server
startServer(); 