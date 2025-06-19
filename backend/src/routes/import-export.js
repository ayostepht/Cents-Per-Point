import express from 'express';
import { getDb } from '../db.js';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import rateLimit from 'express-rate-limit';

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

    // Parse the first line to get headers using proper CSV parsing
    const headerLine = lines[0];
    let headers = parseCSVLine(headerLine);

    // Get a few sample rows for preview using proper CSV parsing
    const sampleRows = [];
    for (let i = 1; i < Math.min(6, lines.length); i++) {
      let row = parseCSVLine(lines[i]);
      
      // Try to reconstruct split values
      row = reconstructValues(null, row);
      
      // Ensure row has same length as headers (pad with empty strings if needed)
      while (row.length < headers.length) {
        row.push('');
      }
      
      sampleRows.push(row);
    }

    // Define the required and optional fields for mapping
    const fieldDefinitions = {
      required: [
        { key: 'source', label: 'Source', description: 'Credit card or loyalty program' },
        { key: 'points', label: 'Points Used', description: 'Number of points used' }
      ],
      optional: [
        { key: 'date', label: 'Date', description: 'Redemption date (defaults to current date if not mapped)' },
        { key: 'value', label: 'Cash Value', description: 'Total cash value in dollars (defaults to 0)' },
        { key: 'taxes', label: 'Taxes/Fees', description: 'Additional taxes or fees in dollars (defaults to 0)' },
        { key: 'notes', label: 'Notes', description: 'Additional notes or description' },
        { key: 'is_travel_credit', label: 'Travel Credit/Free Night', description: 'Whether this is a travel credit or free night award (defaults to false)' }
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
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Import redemptions from CSV with column mapping
const importRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

router.post('/import', importRateLimiter, upload.any(), async (req, res) => {
  // Find the CSV file in the uploaded files
  const file = req.files?.find(f => f.fieldname === 'csvFile' || f.fieldname === 'file');
  if (!file) {
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

  // Validate required mappings - only source and points are required
  const requiredFields = ['source', 'points'];
  const missingFields = requiredFields.filter(field => 
    mappings[field] === undefined || mappings[field] === null || mappings[field] === ''
  );
  
  if (missingFields.length > 0) {
    return res.status(400).json({ 
      error: 'Missing required field mappings',
      missingFields: missingFields,
      message: 'Required fields: Source (credit card/program) and Points Used'
    });
  }

  const pool = await getDb();
  const client = await pool.connect();
  
  try {
    const results = [];
    const errors = [];
    const warnings = [];
    let rowNumber = 1; // Start at 1 for header row

    // Parse CSV from buffer
    const csvContent = file.buffer.toString();
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Get headers for reference
    const headers = parseCSVLine(lines[0]);
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      rowNumber++;
      let row = parseCSVLine(lines[i]);
      
      // Try to reconstruct split values
      row = reconstructValues(null, row);
      
      // Ensure row has same length as headers (pad with empty strings if needed)
      while (row.length < headers.length) {
        row.push('');
      }
      
      // Map the row data using the provided mappings
      const mappedData = {};
      
      // Map required fields
      mappedData.source = mappings.source !== undefined ? row[mappings.source] : '';
      mappedData.points = mappings.points !== undefined ? row[mappings.points] : '';
      
      // Map optional fields (ignore if not mapped)
      mappedData.date = mappings.date !== undefined ? row[mappings.date] : '';
      mappedData.value = mappings.value !== undefined ? row[mappings.value] : '';
      mappedData.taxes = mappings.taxes !== undefined ? row[mappings.taxes] : '';
      mappedData.notes = mappings.notes !== undefined ? row[mappings.notes] : '';
      mappedData.is_travel_credit = mappings.is_travel_credit !== undefined ? row[mappings.is_travel_credit] : '';
      
      // Validate the mapped data
      const validation = validateRow(mappedData, rowNumber);
      if (validation.errors.length > 0) {
        errors.push(...validation.errors);
        continue; // Skip this row due to fatal errors
      }
      
      // Collect warnings but don't skip the row
      if (validation.warnings.length > 0) {
        warnings.push(...validation.warnings);
      }
      
      results.push(validation.data);
    }

    // If there are fatal errors, return them without importing
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        errors: errors,
        warnings: warnings,
        message: `Found ${errors.length} fatal error(s). Please fix these issues and try again.`,
        details: { errors, warnings }
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

    const response = {
      success: true,
      imported: imported,
      skipped: skipped,
      total: results.length,
      message: `Successfully imported ${imported} redemptions${skipped > 0 ? `, skipped ${skipped} due to errors` : ''}.`
    };

    // Include warnings in response if any
    if (warnings.length > 0) {
      response.warnings = warnings;
      response.message += ` Note: ${warnings.length} warning(s) were automatically handled.`;
    }

    res.json(response);

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
  const warnings = [];
  const cleanData = {};

  // Validate date (optional, defaults to current date)
  if (!data.date || data.date.trim() === '') {
    // Default to current date
    cleanData.date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  } else {
    let dateStr = data.date.trim();
    // Handle MM/DD/YYYY and MM/DD/YY formats and convert to YYYY-MM-DD
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        let year = parts[2];
        
        // Handle 2-digit years (assume 20xx for years 00-99)
        if (year.length === 2) {
          const twoDigitYear = parseInt(year);
          if (twoDigitYear >= 0 && twoDigitYear <= 99) {
            year = `20${year.padStart(2, '0')}`;
          }
        }
        
        dateStr = `${year}-${month}-${day}`;
      }
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      warnings.push(`Row ${rowNumber}: Invalid date format '${data.date.trim()}', using current date instead`);
      cleanData.date = new Date().toISOString().split('T')[0];
    } else {
      cleanData.date = dateStr;
    }
  }

  // Validate source (required)
  if (!data.source || data.source.trim() === '') {
    errors.push(`Row ${rowNumber}: Source is required`);
  } else {
    cleanData.source = data.source.trim();
  }

  // Validate points (required)
  if (!data.points || data.points.trim() === '') {
    errors.push(`Row ${rowNumber}: Points is required`);
  } else {
    const pointsStr = data.points.replace(/[,$]/g, ''); // Remove commas and dollar signs
    const points = parseFloat(pointsStr);
    if (isNaN(points) || points < 0) {
      errors.push(`Row ${rowNumber}: Points must be a valid number >= 0`);
    } else {
      cleanData.points = Math.round(points);
    }
  }

  // Validate value (optional, defaults to 0)
  let value = 0;
  if (data.value && data.value.trim() !== '') {
    const valueStr = data.value.replace(/[,$]/g, ''); // Remove commas and dollar signs
    value = parseFloat(valueStr);
    if (isNaN(value) || value < 0) {
      warnings.push(`Row ${rowNumber}: Value must be a valid number >= 0, defaulting to 0`);
      value = 0;
    }
  }
  cleanData.value = value;

  // Validate taxes (optional, defaults to 0)
  let taxes = 0;
  if (data.taxes && data.taxes.trim() !== '') {
    const taxesStr = data.taxes.replace(/[,$]/g, ''); // Remove commas and dollar signs
    taxes = parseFloat(taxesStr);
    if (isNaN(taxes) || taxes < 0) {
      warnings.push(`Row ${rowNumber}: Taxes must be a valid number >= 0, defaulting to 0`);
      taxes = 0;
    }
  }
  cleanData.taxes = taxes;

  // Notes (optional)
  cleanData.notes = data.notes ? data.notes.trim() : '';

  // Validate is_travel_credit (optional, defaults to false)
  const travelCredit = data.is_travel_credit ? data.is_travel_credit.trim().toLowerCase() : 'false';
  if (!['true', 'false', '1', '0', 'yes', 'no', ''].includes(travelCredit)) {
    warnings.push(`Row ${rowNumber}: is_travel_credit must be true/false, 1/0, or yes/no, defaulting to false`);
    cleanData.is_travel_credit = false;
  } else {
    cleanData.is_travel_credit = ['true', '1', 'yes'].includes(travelCredit);
  }

  return { errors, warnings, data: cleanData };
}

// Proper CSV parsing function that handles quoted fields and commas
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
}

// Function to clean and reconstruct values that may have been split by commas
function reconstructValues(headers, row) {
  // Look for patterns like "$3" followed by "455.00" and combine them
  const cleanedRow = [...row];
  
  for (let i = 0; i < cleanedRow.length - 1; i++) {
    const current = cleanedRow[i];
    const next = cleanedRow[i + 1];
    
    // Check if current looks like a partial dollar amount and next looks like the remainder
    if (current && current.match(/^\$\d+$/) && next && next.match(/^\d+\.\d{2}$/)) {
      // Combine them
      cleanedRow[i] = `${current},${next}`;
      cleanedRow.splice(i + 1, 1); // Remove the next element
      
      // Also remove the corresponding header if it exists
      if (headers && headers.length > i + 1) {
        headers.splice(i + 1, 1);
      }
    }
  }
  
  return cleanedRow;
}

export default router; 