import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'postgres',
  database: process.env.DB_NAME || 'cpp_database',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function getDb() {
  return pool;
}

export async function initDb() {
  const client = await pool.connect();
  try {
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
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to create redemptions table: ${error.message}`);
    }

    // Create indexes in a separate transaction
    await client.query('BEGIN');
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_redemptions_date ON redemptions(date);
        CREATE INDEX IF NOT EXISTS idx_redemptions_source ON redemptions(source);
        CREATE INDEX IF NOT EXISTS idx_redemptions_trip_id ON redemptions(trip_id);
      `);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to create indexes: ${error.message}`);
    }

  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

// Graceful shutdown
export async function closeDb() {
  await pool.end();
} 