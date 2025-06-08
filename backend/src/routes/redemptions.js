import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

// Get all redemptions
router.get('/', async (req, res) => {
  const pool = await getDb();
  try {
    const result = await pool.query('SELECT * FROM redemptions ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new redemption
router.post('/', async (req, res) => {
  const { date, source, points, value, taxes, notes, is_travel_credit } = req.body;
  if (!date || !source || (!points && !is_travel_credit) || !value) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const parsedPoints = parseInt(points, 10);
  const parsedValue = parseFloat(value);
  const parsedTaxes = taxes ? parseFloat(taxes) : 0;

  if (isNaN(parsedPoints) && !is_travel_credit) {
    return res.status(400).json({ error: 'Points must be a number' });
  }
  if (isNaN(parsedValue)) {
    return res.status(400).json({ error: 'Value must be a number' });
  }
  if (taxes && isNaN(parsedTaxes)) {
    return res.status(400).json({ error: 'Taxes must be a number' });
  }
  
  const pool = await getDb();
  try {
    const result = await pool.query(
      'INSERT INTO redemptions (date, source, points, value, taxes, notes, is_travel_credit) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [date, source, parsedPoints || 0, parsedValue, parsedTaxes, notes || '', is_travel_credit || false]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single redemption by id
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  const pool = await getDb();
  try {
    const result = await pool.query('SELECT * FROM redemptions WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a redemption by id
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  const { date, source, points, value, taxes, notes, is_travel_credit } = req.body;
  const parsedPoints = points ? parseInt(points, 10) : 0;
  const parsedValue = value ? parseFloat(value) : 0;
  const parsedTaxes = taxes ? parseFloat(taxes) : 0;
  const pool = await getDb();
  try {
    const result = await pool.query(
      'UPDATE redemptions SET date = $1, source = $2, points = $3, value = $4, taxes = $5, notes = $6, is_travel_credit = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8',
      [date, source, parsedPoints, parsedValue, parsedTaxes, notes, is_travel_credit || false, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a redemption by id
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  const pool = await getDb();
  try {
    const result = await pool.query('DELETE FROM redemptions WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 