import request from 'supertest';
import { app } from '../src/index.js';
import { initDb, getDb, closeDb } from '../src/db.js';

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

describe('Redemptions routes', () => {
  let redemptionId;

  it('creates a redemption', async () => {
    const res = await request(app)
      .post('/api/redemptions')
      .send({
        date: '2024-01-01',
        source: 'Test Card',
        points: 1000,
        value: 10,
        taxes: 0,
        notes: 'sample',
        is_travel_credit: false
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    redemptionId = res.body.id;
  });

  it('retrieves all redemptions', async () => {
    const res = await request(app).get('/api/redemptions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('retrieves a single redemption', async () => {
    const res = await request(app).get(`/api/redemptions/${redemptionId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', redemptionId);
  });

  it('updates a redemption', async () => {
    const res = await request(app)
      .put(`/api/redemptions/${redemptionId}`)
      .send({
        date: '2024-01-02',
        source: 'Updated Card',
        points: 2000,
        value: 20,
        taxes: 0,
        notes: 'updated',
        is_travel_credit: false
      });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it('deletes a redemption', async () => {
    const res = await request(app).delete(`/api/redemptions/${redemptionId}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});
