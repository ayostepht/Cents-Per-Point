import request from 'supertest';
import { app } from '../src/index.js';

describe('GET /health', () => {
  it('returns OK status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });
});
