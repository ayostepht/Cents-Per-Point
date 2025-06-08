import express from 'express';
import { getDb } from '../db.js';

/**
 * @openapi
 * components:
 *   schemas:
 *     Redemption:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         date:
 *           type: string
 *           format: date
 *         source:
 *           type: string
 *         points:
 *           type: integer
 *         value:
 *           type: number
 *         taxes:
 *           type: number
 *         notes:
 *           type: string
 *         is_travel_credit:
 *           type: boolean
 */

const router = express.Router();

/**
 * @openapi
 * /api/redemptions:
 *   get:
 *     summary: List all redemptions
 *     tags: [Redemptions]
 *     responses:
 *       200:
 *         description: A JSON array of redemptions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Redemption'
 */
router.get('/', async (req, res) => {
  const pool = await getDb();
  try {
    const result = await pool.query('SELECT * FROM redemptions ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/redemptions:
 *   post:
 *     summary: Create a new redemption
 *     tags: [Redemptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Redemption'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 */
router.post('/', async (req, res) => {
  const { date, source, points, value, taxes, notes, is_travel_credit } = req.body;
  if (!date || !source || (!points && !is_travel_credit) || !value) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const pool = await getDb();
  try {
    const result = await pool.query(
      'INSERT INTO redemptions (date, source, points, value, taxes, notes, is_travel_credit) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [date, source, points || 0, value, taxes || 0, notes || '', is_travel_credit || false]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/redemptions/{id}:
 *   get:
 *     summary: Get a redemption by ID
 *     tags: [Redemptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: A redemption object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Redemption'
 *       404:
 *         description: Not found
 */
router.get('/:id', async (req, res) => {
  const pool = await getDb();
  try {
    const result = await pool.query('SELECT * FROM redemptions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/redemptions/{id}:
 *   put:
 *     summary: Update a redemption
 *     tags: [Redemptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Redemption'
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Not found
 */
router.put('/:id', async (req, res) => {
  const { date, source, points, value, taxes, notes, is_travel_credit } = req.body;
  const pool = await getDb();
  try {
    const result = await pool.query(
      'UPDATE redemptions SET date = $1, source = $2, points = $3, value = $4, taxes = $5, notes = $6, is_travel_credit = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8',
      [date, source, points || 0, value, taxes || 0, notes, is_travel_credit || false, req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/redemptions/{id}:
 *   delete:
 *     summary: Delete a redemption
 *     tags: [Redemptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Not found
 */
router.delete('/:id', async (req, res) => {
  const pool = await getDb();
  try {
    const result = await pool.query('DELETE FROM redemptions WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 