import request from 'supertest';
import { app } from '../src/index.js';
import { initDb, getDb, closeDb } from '../src/db.js';

const csvData = `date,source,points,value,taxes,notes,is_travel_credit\n2024-02-01,Test Card,1500,25,1,imported,false\n`;
const mappings = { date: 0, source: 1, points: 2, value: 3, taxes: 4, notes: 5, is_travel_credit: 6 };

beforeAll(async () => {
  await initDb();
  const pool = await getDb();
  await pool.query('TRUNCATE TABLE redemptions');
});

afterAll(async () => {
  const pool = await getDb();
  await pool.query('DROP TABLE IF EXISTS redemptions');
  await closeDb();
});

describe('Import/Export routes', () => {
  it('provides a CSV template', async () => {
    const res = await request(app).get('/api/import-export/template');
    expect(res.status).toBe(200);
    expect(res.text).toContain('date,source,points');
  });

  it('analyzes a CSV file', async () => {
    const res = await request(app)
      .post('/api/import-export/analyze')
      .attach('csvFile', Buffer.from(csvData), 'sample.csv');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('headers');
    expect(Array.isArray(res.body.headers)).toBe(true);
  });

  it('imports redemptions from CSV', async () => {
    const res = await request(app)
      .post('/api/import-export/import')
      .field('columnMappings', JSON.stringify(mappings))
      .attach('csvFile', Buffer.from(csvData), 'sample.csv');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.imported).toBe(1);
  });

  it('exports redemptions as CSV', async () => {
    const res = await request(app).get('/api/import-export/export');
    expect(res.status).toBe(200);
    expect(res.text).toContain('date,source,points');
  });
});
