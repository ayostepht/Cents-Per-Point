import express from 'express';
import { getDb } from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Set up multer for image uploads
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `trip_${req.params.id}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Serve uploads statically
router.use('/uploads', express.static(uploadDir));

// Upload image for a trip
router.post('/:id/upload-image', upload.single('image'), async (req, res) => {
  const pool = await getDb();
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  const imageUrl = `/api/trips/uploads/${file.filename}`;
  await pool.query('UPDATE trips SET image = $1 WHERE id = $2', [imageUrl, req.params.id]);
  res.json({ imageUrl });
});

// Get all trips
router.get('/', async (req, res) => {
  const pool = await getDb();
  try {
    // Get all trips
    const result = await pool.query('SELECT * FROM trips ORDER BY name');
    const trips = result.rows;

    // Get summary stats for all trips in one query
    const statsResult = await pool.query(`
      SELECT
        trip_id,
        COUNT(*) as total_redemptions,
        SUM(points) as total_points,
        SUM(value) as total_value
      FROM redemptions
      GROUP BY trip_id
    `);

    // Map stats by trip_id
    const statsMap = {};
    statsResult.rows.forEach(row => {
      statsMap[row.trip_id] = {
        total_redemptions: Number(row.total_redemptions),
        total_points: Number(row.total_points),
        total_value: Number(row.total_value),
      };
    });

    // Attach stats to each trip
    const tripsWithStats = trips.map(trip => ({
      ...trip,
      ...statsMap[trip.id] // may be undefined if no redemptions
    }));

    res.json(tripsWithStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new trip
router.post('/', async (req, res) => {
  const { name, description, image, start_date, end_date } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Trip name is required' });
  }
  const pool = await getDb();
  try {
    const result = await pool.query(
      'INSERT INTO trips (name, description, image, start_date, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description || '', image || '', start_date || null, end_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single trip by id
router.get('/:id', async (req, res) => {
  const pool = await getDb();
  try {
    const result = await pool.query('SELECT * FROM trips WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a trip
router.put('/:id', async (req, res) => {
  const { name, description, image, start_date, end_date } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Trip name is required' });
  }
  const pool = await getDb();
  try {
    const result = await pool.query(
      'UPDATE trips SET name = $1, description = $2, image = $3, start_date = $4, end_date = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, description || '', image || '', start_date || null, end_date || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a trip
router.delete('/:id', async (req, res) => {
  const pool = await getDb();
  try {
    // First check if there are any redemptions using this trip
    const redemptionsResult = await pool.query(
      'SELECT COUNT(*) FROM redemptions WHERE trip_id = $1',
      [req.params.id]
    );
    
    if (parseInt(redemptionsResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete trip that has associated redemptions. Please reassign or delete the redemptions first.' 
      });
    }
    
    const result = await pool.query('DELETE FROM trips WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trip statistics
router.get('/:id/stats', async (req, res) => {
  const pool = await getDb();
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_redemptions,
        SUM(value) as total_value,
        SUM(points) as total_points,
        CASE 
          WHEN SUM(points) > 0 THEN ROUND(SUM(value)::numeric / SUM(points)::numeric, 2)
          ELSE 0 
        END as average_cpp
      FROM redemptions 
      WHERE trip_id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No statistics found for this trip' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all redemptions for a trip
router.delete('/:id/redemptions', async (req, res) => {
  const pool = await getDb();
  try {
    await pool.query('DELETE FROM redemptions WHERE trip_id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove trip association from all redemptions for a trip
router.patch('/:id/redemptions/remove-association', async (req, res) => {
  const pool = await getDb();
  try {
    await pool.query('UPDATE redemptions SET trip_id = NULL WHERE trip_id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 