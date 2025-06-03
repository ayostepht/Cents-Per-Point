import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SQLite connection
const sqliteDbPath = path.join(__dirname, '../data/database.sqlite');

// PostgreSQL connection
const { Pool } = pg;
const pgPool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'cpp_database',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function migrateSQLiteToPostgreSQL() {
  let sqliteDb;
  let pgClient;
  
  try {
    // Connect to SQLite
    sqliteDb = await open({
      filename: sqliteDbPath,
      driver: sqlite3.Database
    });
    
    // Connect to PostgreSQL
    pgClient = await pgPool.connect();
    
    console.log('Connected to both databases');
    
    // Get all data from SQLite
    const redemptions = await sqliteDb.all('SELECT * FROM redemptions ORDER BY id');
    console.log(`Found ${redemptions.length} redemptions to migrate`);
    
    // Begin transaction in PostgreSQL
    await pgClient.query('BEGIN');
    
    // Clear existing data (optional - remove if you want to preserve existing data)
    await pgClient.query('TRUNCATE TABLE redemptions RESTART IDENTITY');
    
    // Insert data into PostgreSQL
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
          redemption.is_travel_credit === 1
        ]
      );
    }
    
    // Commit transaction
    await pgClient.query('COMMIT');
    console.log('Migration completed successfully!');
    
  } catch (error) {
    if (pgClient) {
      await pgClient.query('ROLLBACK');
    }
    console.error('Migration failed:', error);
    throw error;
  } finally {
    if (sqliteDb) await sqliteDb.close();
    if (pgClient) pgClient.release();
    await pgPool.end();
  }
}

// Run migration
migrateSQLiteToPostgreSQL()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
