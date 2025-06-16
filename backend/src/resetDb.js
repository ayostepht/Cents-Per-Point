import { getDb, closeDb } from './db.js';

async function resetDb() {
  const pool = await getDb();
  const client = await pool.connect();
  
  try {
    // Drop existing tables and indexes
    await client.query('BEGIN');
    try {
      await client.query(`
        DROP TABLE IF EXISTS redemptions CASCADE;
        DROP TABLE IF EXISTS trips CASCADE;
      `);
      await client.query('COMMIT');
      console.log('Successfully dropped existing tables');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to drop tables: ${error.message}`);
    }

    // Create trips table
    await client.query('BEGIN');
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS trips (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          image TEXT,
          start_date DATE,
          end_date DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await client.query('COMMIT');
      console.log('Successfully created trips table');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to create trips table: ${error.message}`);
    }

    // Create redemptions table
    await client.query('BEGIN');
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS redemptions (
          id SERIAL PRIMARY KEY,
          date DATE NOT NULL,
          source VARCHAR(255) NOT NULL,
          points INTEGER NOT NULL,
          value DECIMAL(10,2) NOT NULL,
          taxes DECIMAL(10,2) DEFAULT 0,
          notes TEXT,
          is_travel_credit BOOLEAN DEFAULT FALSE,
          trip_id INTEGER REFERENCES trips(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await client.query('COMMIT');
      console.log('Successfully created redemptions table');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to create redemptions table: ${error.message}`);
    }

    // Verify table structure
    const tableCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'redemptions' AND column_name = 'trip_id';
    `);
    
    if (tableCheck.rows.length === 0) {
      throw new Error('trip_id column not found in redemptions table');
    }
    console.log('Verified table structure');

    // Create indexes
    await client.query('BEGIN');
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_redemptions_date ON redemptions(date);
        CREATE INDEX IF NOT EXISTS idx_redemptions_source ON redemptions(source);
        CREATE INDEX IF NOT EXISTS idx_redemptions_trip_id ON redemptions(trip_id);
      `);
      await client.query('COMMIT');
      console.log('Successfully created indexes');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to create indexes: ${error.message}`);
    }

  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  } finally {
    client.release();
    await closeDb();
  }
}

// Run the reset if this file is executed directly
if (process.argv[1] === import.meta.url) {
  resetDb()
    .then(() => {
      console.log('Database reset completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Database reset failed:', error);
      process.exit(1);
    });
}

export { resetDb }; 