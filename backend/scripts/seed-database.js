import { getDb, initDb } from '../src/db.js';

const sampleData = [
  {
    date: '2024-01-15',
    source: 'Chase Sapphire Reserve',
    points: 50000,
    value: 750.00,
    taxes: 25.60,
    notes: 'Flight to Tokyo',
    is_travel_credit: false
  },
  {
    date: '2024-01-20',
    source: 'Amex Platinum',
    points: 0,
    value: 200.00,
    taxes: 0,
    notes: 'Airline fee credit',
    is_travel_credit: true
  }
];

async function seedDatabase() {
  try {
    await initDb();
    const pool = await getDb();
    
    console.log('Seeding database with sample data...');
    
    for (const item of sampleData) {
      await pool.query(
        'INSERT INTO redemptions (date, source, points, value, taxes, notes, is_travel_credit) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [item.date, item.source, item.points, item.value, item.taxes, item.notes, item.is_travel_credit]
      );
    }
    
    console.log(`Seeded ${sampleData.length} sample redemptions`);
  } catch (error) {
    console.error('Seeding failed:', error);
  }
}

seedDatabase();
