import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_redemptions_date ON redemptions(date);
      CREATE INDEX IF NOT EXISTS idx_redemptions_source ON redemptions(source);
    `);
  } finally {
    client.release();
  }
}

// Graceful shutdown
export async function closeDb() {
  await pool.end();
} 