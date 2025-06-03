import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

async function importToPostgreSQL() {
  const importPath = path.join(__dirname, '../data/sqlite-export.json');
  
  // Check if export file exists
  if (!fs.existsSync(importPath)) {
    console.error('❌ Export file not found:', importPath);
    console.log('💡 Please run the export script first or copy sqlite-export.json to the data directory');
    process.exit(1);
  }
  
  const pgPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'cpp_database',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  });
  
  let pgClient;
  
  try {
    // Read export data
    const exportData = JSON.parse(fs.readFileSync(importPath, 'utf8'));
    const redemptions = exportData.data.redemptions;
    
    console.log(`📊 Found ${redemptions.length} redemptions to import`);
    console.log(`📅 Export date: ${exportData.timestamp}`);
    
    // Connect to PostgreSQL
    pgClient = await pgPool.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Begin transaction
    await pgClient.query('BEGIN');
    
    // Clear existing data (optional)
    await pgClient.query('TRUNCATE TABLE redemptions RESTART IDENTITY');
    console.log('🗑️  Cleared existing data');
    
    // Import data
    let imported = 0;
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
      imported++;
      
      if (imported % 10 === 0) {
        console.log(`📥 Imported ${imported}/${redemptions.length} redemptions...`);
      }
    }
    
    // Commit transaction
    await pgClient.query('COMMIT');
    console.log(`🎉 Successfully imported ${imported} redemptions!`);
    
    // Verify import
    const result = await pgClient.query('SELECT COUNT(*) FROM redemptions');
    console.log(`✅ Verification: ${result.rows[0].count} redemptions in PostgreSQL`);
    
  } catch (error) {
    if (pgClient) {
      await pgClient.query('ROLLBACK');
    }
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    if (pgClient) pgClient.release();
    await pgPool.end();
  }
}

// Run import
importToPostgreSQL()
  .then(() => {
    console.log('\n🎉 Import completed successfully!');
    console.log('🚀 Your data has been migrated to PostgreSQL');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Import failed:', error.message);
    process.exit(1);
  }); 