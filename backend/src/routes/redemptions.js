import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

// Get all redemptions
router.get('/', async (req, res) => {
  const db = await getDb();
  const rows = await db.all('SELECT * FROM redemptions ORDER BY date DESC');
  await db.close();
  res.json(rows);
});

// Add a new redemption
router.post('/', async (req, res) => {
  const { date, source, points, value, taxes, notes } = req.body;
  if (!date || !source || !points || !value) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO redemptions (date, source, points, value, taxes, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [date, source, points, value, taxes || 0, notes || '']
  );
  await db.close();
  res.status(201).json({ id: result.lastID });
});

// Get a single redemption by id
router.get('/:id', async (req, res) => {
  const db = await getDb();
  const row = await db.get('SELECT * FROM redemptions WHERE id = ?', [req.params.id]);
  await db.close();
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// Update a redemption by id
router.put('/:id', async (req, res) => {
  const { date, source, points, value, taxes, notes } = req.body;
  const db = await getDb();
  const result = await db.run(
    'UPDATE redemptions SET date = ?, source = ?, points = ?, value = ?, taxes = ?, notes = ? WHERE id = ?',
    [date, source, points, value, taxes || 0, notes, req.params.id]
  );
  await db.close();
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// Delete a redemption by id
router.delete('/:id', async (req, res) => {
  const db = await getDb();
  const result = await db.run('DELETE FROM redemptions WHERE id = ?', [req.params.id]);
  await db.close();
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

export default router; 