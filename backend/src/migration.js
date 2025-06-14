import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Automatic migration from SQLite to PostgreSQL
 * This runs on startup and migrates data seamlessly for users
 */
export async function autoMigrate(pgPool) {
  const migrationFlagPath = path.join(__dirname, '../data/.migrated');
  
  // Check if migration already completed
  if (fs.existsSync(migrationFlagPath)) {
    console.log('✅ Migration already completed, skipping...');
    return;
  }
  
  // Possible SQLite database locations
  const possibleSqlitePaths = [
    path.join(__dirname, '../data/database.sqlite'),  // Standard location
    '/app/data/database.sqlite',                      // Docker volume mount
    './data/database.sqlite'                          // Relative path
  ];
  
  let sqliteDbPath = null;
  for (const dbPath of possibleSqlitePaths) {
    if (fs.existsSync(dbPath)) {
      sqliteDbPath = dbPath;
      console.log(`📍 Found SQLite database at: ${dbPath}`);
      break;
    }
  }
  
  // Check if SQLite database exists
  if (!sqliteDbPath) {
    console.log('ℹ️  No SQLite database found, starting fresh with PostgreSQL');
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    // Create migration flag to prevent future checks
    fs.writeFileSync(migrationFlagPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      status: 'no_sqlite_found',
      message: 'Started fresh with PostgreSQL'
    }, null, 2));
    return;
  }
  
  console.log('🔄 SQLite database detected, starting automatic migration...');
  
  try {
    // Dynamic import of SQLite modules (only when needed)
    const { default: sqlite3 } = await import('sqlite3');
    const { open } = await import('sqlite');
    
    // Connect to SQLite
    const sqliteDb = await open({
      filename: sqliteDbPath,
      driver: sqlite3.Database
    });
    
    // Get all redemptions from SQLite
    const redemptions = await sqliteDb.all('SELECT * FROM redemptions ORDER BY id');
    console.log(`📊 Found ${redemptions.length} redemptions to migrate`);
    
    if (redemptions.length === 0) {
      console.log('ℹ️  No data to migrate');
      await sqliteDb.close();
      fs.writeFileSync(migrationFlagPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        status: 'empty_sqlite',
        message: 'SQLite database was empty'
      }, null, 2));
      return;
    }
    
    // Get PostgreSQL client
    const pgClient = await pgPool.connect();
    
    try {
      // Check if PostgreSQL table has any data
      const existingData = await pgClient.query('SELECT COUNT(*) FROM redemptions');
      const existingCount = parseInt(existingData.rows[0].count);
      
      if (existingCount > 0) {
        console.log(`⚠️  PostgreSQL already has ${existingCount} redemptions, skipping migration`);
        await sqliteDb.close();
        pgClient.release();
        fs.writeFileSync(migrationFlagPath, JSON.stringify({
          timestamp: new Date().toISOString(),
          status: 'skipped_existing_data',
          message: `PostgreSQL already had ${existingCount} redemptions`
        }, null, 2));
        return;
      }
      
      // Begin transaction
      await pgClient.query('BEGIN');
      
      // Migrate data
      let migrated = 0;
      for (const redemption of redemptions) {
        await pgClient.query(
          `INSERT INTO redemptions (date, source, points, value, taxes, notes, is_travel_credit) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            redemption.date,
            redemption.source,
            redemption.points,
            redemption.value,
            redemption.taxes || 0,
            redemption.notes || '',
            redemption.is_travel_credit === 1 || redemption.is_travel_credit === true
          ]
        );
        migrated++;
      }
      
      // Commit transaction
      await pgClient.query('COMMIT');
      
      // Verify migration
      const verifyResult = await pgClient.query('SELECT COUNT(*) FROM redemptions');
      const migratedCount = parseInt(verifyResult.rows[0].count);
      
      console.log(`🎉 Successfully migrated ${migrated} redemptions!`);
      console.log(`✅ Verification: ${migratedCount} redemptions now in PostgreSQL`);
      
      // Create backup of SQLite file
      const backupPath = path.join(path.dirname(sqliteDbPath), 'database.sqlite.backup');
      fs.copyFileSync(sqliteDbPath, backupPath);
      console.log(`💾 SQLite backup created: ${backupPath}`);
      
      // Create migration flag
      const migrationInfo = {
        timestamp: new Date().toISOString(),
        status: 'completed',
        migratedCount: migrated,
        source: 'sqlite',
        target: 'postgresql',
        sqliteLocation: sqliteDbPath,
        backupLocation: backupPath
      };
      fs.writeFileSync(migrationFlagPath, JSON.stringify(migrationInfo, null, 2));
      
    } catch (error) {
      await pgClient.query('ROLLBACK');
      throw error;
    } finally {
      pgClient.release();
      await sqliteDb.close();
    }
    
  } catch (error) {
    console.error('❌ Automatic migration failed:', error);
    console.log('🔧 Manual migration may be required');
    
    // Create error flag
    const errorInfo = {
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: error.message,
      sqliteLocation: sqliteDbPath
    };
    
    try {
      const dataDir = path.join(__dirname, '../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(migrationFlagPath, JSON.stringify(errorInfo, null, 2));
    } catch (writeError) {
      console.error('Failed to write error flag:', writeError);
    }
    
    // Don't throw - let the app start anyway
  }
}

/**
 * Check if migration is needed (for health checks)
 */
export function isMigrationComplete() {
  const migrationFlagPath = path.join(__dirname, '../data/.migrated');
  return fs.existsSync(migrationFlagPath);
}

/**
 * Get migration status details
 */
export function getMigrationStatus() {
  const migrationFlagPath = path.join(__dirname, '../data/.migrated');
  
  if (!fs.existsSync(migrationFlagPath)) {
    return { status: 'pending', message: 'Migration not yet attempted' };
  }
  
  try {
    const flagContent = fs.readFileSync(migrationFlagPath, 'utf8');
    // Try to parse as JSON, fallback to simple timestamp
    try {
      return JSON.parse(flagContent);
    } catch {
      return { status: 'completed', timestamp: flagContent };
    }
  } catch (error) {
    return { status: 'unknown', error: error.message };
  }
} 