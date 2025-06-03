import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportSQLiteData() {
  const sqliteDbPath = path.join(__dirname, '../data/database.sqlite');
  const exportPath = path.join(__dirname, '../data/sqlite-export.json');
  
  try {
    const db = await open({
      filename: sqliteDbPath,
      driver: sqlite3.Database
    });
    
    const redemptions = await db.all('SELECT * FROM redemptions ORDER BY id');
    
    const exportData = {
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      source: 'sqlite',
      count: redemptions.length,
      data: {
        redemptions: redemptions
      }
    };
    
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`✅ Exported ${redemptions.length} redemptions to ${exportPath}`);
    console.log('📋 Export summary:');
    console.log(`   - Total redemptions: ${redemptions.length}`);
    console.log(`   - Export file: sqlite-export.json`);
    console.log(`   - File size: ${(fs.statSync(exportPath).size / 1024).toFixed(2)} KB`);
    
    await db.close();
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  }
}

exportData();

async function exportData() {
  try {
    await exportSQLiteData();
    console.log('\n🎉 Export completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Copy sqlite-export.json to a safe location');
    console.log('   2. Deploy the new PostgreSQL version');
    console.log('   3. Run the import script to restore your data');
  } catch (error) {
    console.error('\n💥 Export failed:', error.message);
    process.exit(1);
  }
} 