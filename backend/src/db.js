import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/database.sqlite');

export async function getDb() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

export async function initDb() {
  const db = await getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      source TEXT NOT NULL,
      points INTEGER NOT NULL,
      value REAL NOT NULL,
      taxes REAL DEFAULT 0,
      notes TEXT
    );
  `);
  // Add taxes column if upgrading
  await db.exec('ALTER TABLE redemptions ADD COLUMN taxes REAL DEFAULT 0;').catch(() => {});
  await db.close();
} 