import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function backupSQLiteData() {
  const sqliteDbPath = path.join(__dirname, '../data/database.sqlite');
  const backupPath = path.join(__dirname, '../data/backup-' + Date.now() + '.json');
  
  try {
    const db = await open({
      filename: sqliteDbPath,
      driver: sqlite3.Database
    });
    
    const redemptions = await db.all('SELECT * FROM redemptions ORDER BY id');
    
    const backup = {
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      data: {
        redemptions: redemptions
      }
    };
    
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`Backup created: ${backupPath}`);
    console.log(`Backed up ${redemptions.length} redemptions`);
    
    await db.close();
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
}

backupSQLiteData();
