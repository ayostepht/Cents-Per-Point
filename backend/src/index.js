// Set production environment for Docker deployments
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

import express from 'express';
import cors from 'cors';
import { initDb, closeDb, getDb } from './db.js';
import { autoMigrate, isMigrationComplete, getMigrationStatus } from './migration.js';
import redemptionsRouter from './routes/redemptions.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/redemptions', redemptionsRouter);

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

startServer(); 