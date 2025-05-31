import express from 'express';
import { getDb } from '../db.js';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

const router = express.Router();

// Configure multer for file uploads (memory storage for CSV)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Export all redemptions as CSV
router.get('/export', async (req, res) => {
  const pool = await getDb();
  try {
    const result = await pool.query('SELECT * FROM redemptions ORDER BY date DESC');
    const redemptions = result.rows;

    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="redemptions-export.csv"');

    // CSV header row
    const headers = [
      'date',
      'source', 
      'points',
      'value',
      'taxes',
      'notes',
      'is_travel_credit'
    ];
    
    res.write(headers.join(',') + '\n');

    // Write data rows
    for (const redemption of redemptions) {
      const row = [
        redemption.date ? new Date(redemption.date).toISOString().split('T')[0] : '',
        `"${(redemption.source || '').replace(/"/g, '""')}"`, // Escape quotes
        redemption.points || 0,
        redemption.value || 0,
        redemption.taxes || 0,
        `"${(redemption.notes || '').replace(/"/g, '""')}"`, // Escape quotes
        redemption.is_travel_credit ? 'true' : 'false'
      ];
      res.write(row.join(',') + '\n');
    }

    res.end();
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Download CSV template
router.get('/template', (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="redemptions-template.csv"');
  
  const headers = [
    'date',
    'source',
    'points', 
    'value',
    'taxes',
    'notes',
    'is_travel_credit'
  ];
  
  const sampleData = [
    '2024-01-15',
    'Chase Ultimate Rewards',
    '50000',
    '750.00',
    '50.00',
    'Flight to Tokyo',
    'false'
  ];
  
  res.write(headers.join(',') + '\n');
  res.write(sampleData.join(',') + '\n');
  res.end();
});

// Analyze CSV headers for column mapping
router.post('/analyze', upload.single('csvFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file provided' });
  }

  try {
    const csvContent = req.file.buffer.toString();
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    // Parse the first line to get headers
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(header => 
      header.trim().replace(/^["']|["']$/g, '') // Remove quotes
    );

    // Get a few sample rows for preview
    const sampleRows = [];
    for (let i = 1; i < Math.min(6, lines.length); i++) {
      const row = lines[i].split(',').map(cell => 
        cell.trim().replace(/^["']|["']$/g, '') // Remove quotes
      );
      sampleRows.push(row);
    }

    // Define the required and optional fields for mapping
    const fieldDefinitions = {
      required: [
        { key: 'date', label: 'Date', description: 'Redemption date (YYYY-MM-DD format)' },
        { key: 'source', label: 'Source', description: 'Credit card or loyalty program' },
        { key: 'value', label: 'Cash Value', description: 'Total cash value in dollars' }
      ],
      optional: [
        { key: 'points', label: 'Points', description: 'Number of points used (0 for travel credits)' },
        { key: 'taxes', label: 'Taxes/Fees', description: 'Additional taxes or fees in dollars' },
        { key: 'notes', label: 'Notes', description: 'Additional notes or description' },
        { key: 'is_travel_credit', label: 'Travel Credit/Free Night', description: 'Whether this is a travel credit or free night award' }
      ]
    };

    // Suggest automatic mappings based on header names
    const suggestedMappings = {};
    headers.forEach((header, index) => {
      const lowerHeader = header.toLowerCase();
      
      // Try to match common column names
      if (lowerHeader.includes('date')) {
        suggestedMappings.date = index;
      } else if (lowerHeader.includes('source') || lowerHeader.includes('program') || lowerHeader.includes('card')) {
        suggestedMappings.source = index;
      } else if (lowerHeader.includes('point') && !lowerHeader.includes('cpp')) {
        suggestedMappings.points = index;
      } else if (lowerHeader.includes('value') || lowerHeader.includes('amount') || lowerHeader.includes('cost')) {
        suggestedMappings.value = index;
      } else if (lowerHeader.includes('tax') || lowerHeader.includes('fee')) {
        suggestedMappings.taxes = index;
      } else if (lowerHeader.includes('note') || lowerHeader.includes('description') || lowerHeader.includes('comment')) {
        suggestedMappings.notes = index;
      } else if (lowerHeader.includes('credit') || lowerHeader.includes('free') || lowerHeader.includes('award')) {
        suggestedMappings.is_travel_credit = index;
      }
    });

    res.json({
      success: true,
      headers: headers,
      sampleRows: sampleRows,
      fieldDefinitions: fieldDefinitions,
      suggestedMappings: suggestedMappings,
      totalRows: lines.length - 1 // Exclude header row
    });

  } catch (error) {
    console.error('CSV analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze CSV file',
      message: error.message 
    });
  }
});

// Import redemptions from CSV with column mapping
router.post('/import', upload.single('csvFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file provided' });
  }

  const { columnMappings } = req.body;
  
  if (!columnMappings) {
    return res.status(400).json({ error: 'Column mappings are required' });
  }

  let mappings;
  try {
    mappings = typeof columnMappings === 'string' ? JSON.parse(columnMappings) : columnMappings;
  } catch (error) {
    return res.status(400).json({ error: 'Invalid column mappings format' });
  }

  // Validate required mappings
  const requiredFields = ['date', 'source', 'value'];
  const missingFields = requiredFields.filter(field => 
    mappings[field] === undefined || mappings[field] === null || mappings[field] === ''
  );
  
  if (missingFields.length > 0) {
    return res.status(400).json({ 
      error: 'Missing required field mappings',
      missingFields: missingFields
    });
  }

  const pool = await getDb();
  const client = await pool.connect();
  
  try {
    const results = [];
    const errors = [];
    let rowNumber = 1; // Start at 1 for header row

    // Parse CSV from buffer
    const csvContent = req.file.buffer.toString();
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      rowNumber++;
      const row = lines[i].split(',').map(cell => 
        cell.trim().replace(/^["']|["']$/g, '') // Remove quotes
      );
      
      // Map the row data using the provided mappings
      const mappedData = {};
      
      // Map required fields
      mappedData.date = mappings.date !== undefined ? row[mappings.date] : '';
      mappedData.source = mappings.source !== undefined ? row[mappings.source] : '';
      mappedData.value = mappings.value !== undefined ? row[mappings.value] : '';
      
      // Map optional fields
      mappedData.points = mappings.points !== undefined ? row[mappings.points] : '';
      mappedData.taxes = mappings.taxes !== undefined ? row[mappings.taxes] : '';
      mappedData.notes = mappings.notes !== undefined ? row[mappings.notes] : '';
      mappedData.is_travel_credit = mappings.is_travel_credit !== undefined ? row[mappings.is_travel_credit] : '';
      
      // Validate the mapped data
      const validation = validateRow(mappedData, rowNumber);
      if (validation.errors.length > 0) {
        errors.push(...validation.errors);
        continue;
      }
      
      results.push(validation.data);
    }

    // If there are validation errors, return them without importing
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        errors: errors,
        message: `Found ${errors.length} validation error(s). Please fix these issues and try again.`
      });
    }

    // Begin transaction
    await client.query('BEGIN');

    let imported = 0;
    let skipped = 0;

    // Import valid rows
    for (const row of results) {
      try {
        await client.query(
          'INSERT INTO redemptions (date, source, points, value, taxes, notes, is_travel_credit) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [row.date, row.source, row.points, row.value, row.taxes, row.notes, row.is_travel_credit]
        );
        imported++;
      } catch (error) {
        console.error(`Error importing row:`, error);
        skipped++;
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    res.json({
      success: true,
      imported: imported,
      skipped: skipped,
      total: results.length,
      message: `Successfully imported ${imported} redemptions${skipped > 0 ? `, skipped ${skipped} due to errors` : ''}.`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Import error:', error);
    res.status(500).json({ 
      error: 'Failed to import CSV',
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// Validation function for CSV rows
function validateRow(data, rowNumber) {
  const errors = [];
  const cleanData = {};

  // Validate date
  if (!data.date || data.date.trim() === '') {
    errors.push(`Row ${rowNumber}: Date is required`);
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date.trim())) {
      errors.push(`Row ${rowNumber}: Date must be in YYYY-MM-DD format`);
    } else {
      const date = new Date(data.date.trim());
      if (isNaN(date.getTime())) {
        errors.push(`Row ${rowNumber}: Invalid date`);
      } else {
        cleanData.date = data.date.trim();
      }
    }
  }

  // Validate source
  if (!data.source || data.source.trim() === '') {
    errors.push(`Row ${rowNumber}: Source is required`);
  } else {
    cleanData.source = data.source.trim();
  }

  // Validate points
  const points = parseFloat(data.points);
  if (isNaN(points) || points < 0) {
    errors.push(`Row ${rowNumber}: Points must be a valid number >= 0`);
  } else {
    cleanData.points = Math.round(points);
  }

  // Validate value
  const value = parseFloat(data.value);
  if (isNaN(value) || value <= 0) {
    errors.push(`Row ${rowNumber}: Value must be a valid number > 0`);
  } else {
    cleanData.value = value;
  }

  // Validate taxes (optional)
  const taxes = data.taxes ? parseFloat(data.taxes) : 0;
  if (isNaN(taxes) || taxes < 0) {
    errors.push(`Row ${rowNumber}: Taxes must be a valid number >= 0`);
  } else {
    cleanData.taxes = taxes;
  }

  // Notes (optional)
  cleanData.notes = data.notes ? data.notes.trim() : '';

  // Validate is_travel_credit (optional)
  const travelCredit = data.is_travel_credit ? data.is_travel_credit.trim().toLowerCase() : 'false';
  if (!['true', 'false', '1', '0', 'yes', 'no'].includes(travelCredit)) {
    errors.push(`Row ${rowNumber}: is_travel_credit must be true/false, 1/0, or yes/no`);
  } else {
    cleanData.is_travel_credit = ['true', '1', 'yes'].includes(travelCredit);
  }

  return { errors, data: cleanData };
}

export default router; 