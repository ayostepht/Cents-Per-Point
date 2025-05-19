import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

// Get API base URL dynamically based on current window location
const getApiBaseUrl = () => {
  const { protocol, hostname } = window.location;
  // If running on port 3333, use port 5000 for API
  return `${protocol}//${hostname}:5000`;
};

const API_BASE_URL = getApiBaseUrl();

const usd = n => n !== '' && n !== null && n !== undefined ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '';

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'source', label: 'Source' },
  { key: 'points', label: 'Points Used' },
  { key: 'taxes', label: 'Taxes/Fees ($)' },
  { key: 'value', label: 'Total Cash Value ($)' },
  { key: 'cpp', label: 'CPP' },
  { key: 'notes', label: 'Notes' },
  { key: 'actions', label: 'Actions' }
];

const PAGE_SIZE = 25;

const todayStr = () => new Date().toISOString().slice(0, 10);

// Helper for required asterisk
const RequiredAsterisk = () => (
  <span style={{ color: 'red', marginLeft: 2 }} title="Required" aria-label="Required">*</span>
);

// Simple Modal component
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 340, boxShadow: '0 4px 32px #0002', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}>&times;</button>
        {children}
      </div>
    </div>
  );
}

// Define source options by group, sorted alphabetically within each group
const sourceOptions = [
  {
    label: 'Credit Card',
    options: [
      'Chase', 'Amex', 'Citi', 'Bilt', 'Capital One'
    ].sort()
  },
  {
    label: 'Airline',
    options: [
      'American Airlines', 'Delta', 'Southwest', 'United', 'Alaskan Air'
    ].sort()
  },
  {
    label: 'Hotel',
    options: [
      'Hyatt', 'Hilton', 'Marriott', 'IHG'
    ].sort()
  }
];

export default function Redemptions() {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' });
  const [deleting, setDeleting] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filters, setFilters] = useState({ source: '', dateFrom: '', dateTo: '' });
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({ date: todayStr(), source: '', points: '', taxes: '', value: '', notes: '' });

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sourceParam = params.get('source');
    if (sourceParam) {
      setFilters(f => ({ ...f, source: sourceParam }));
    }
    // eslint-disable-next-line
  }, [location.search]);

  useEffect(() => {
    fetchRedemptions();
  }, []);

  const fetchRedemptions = () => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/redemptions`)
      .then(res => {
        setRedemptions(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleSort = key => {
    setSort(s => ({
      key,
      dir: s.key === key ? (s.dir === 'asc' ? 'desc' : 'asc') : 'asc'
    }));
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this redemption?')) return;
    setDeleting(id);
    try {
      await axios.delete(`${API_BASE_URL}/api/redemptions/${id}`);
      fetchRedemptions();
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = r => {
    setEditingId(r.id);
    setEditForm({
      date: r.date,
      source: r.source,
      points: r.points,
      taxes: r.taxes,
      value: r.value,
      notes: r.notes
    });
  };

  const handleEditChange = e => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async id => {
    await axios.put(`${API_BASE_URL}/api/redemptions/${id}`, {
      date: editForm.date,
      source: editForm.source,
      points: Number(editForm.points),
      value: Number(editForm.value),
      taxes: Number(editForm.taxes),
      notes: editForm.notes
    });
    setEditingId(null);
    fetchRedemptions();
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const handleAddChange = e => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };

  // Validation for add form
  const requiredFields = [
    { key: 'date', label: 'Date' },
    { key: 'source', label: 'Source' },
    { key: 'points', label: 'Points Used' },
    { key: 'value', label: 'Total Cash Value ($)' }
  ];
  const missingFields = requiredFields.filter(f => !addForm[f.key] || Number(addForm[f.key]) === 0);
  const isAddValid = missingFields.length === 0;

  const handleAddSave = async () => {
    if (!isAddValid) {
      alert('Please complete the following required fields: ' + missingFields.map(f => f.label).join(', '));
      return;
    }
    await axios.post(`${API_BASE_URL}/api/redemptions`, {
      date: addForm.date,
      source: addForm.source,
      points: Number(addForm.points),
      value: Number(addForm.value),
      taxes: Number(addForm.taxes),
      notes: addForm.notes
    });
    setAddForm({ date: todayStr(), source: '', points: '', taxes: '', value: '', notes: '' });
    setAdding(false);
    fetchRedemptions();
  };

  const handleAddCancel = () => {
    setAddForm({ date: todayStr(), source: '', points: '', taxes: '', value: '', notes: '' });
    setAdding(false);
  };

  // Prepare data with cpp calculated
  const tableData = redemptions.map(r => {
    const cpp = r.points > 0 ? ((r.value - (r.taxes || 0)) / r.points) * 100 : '';
    return { ...r, cpp };
  });

  // Unique sources for dropdown
  const uniqueSources = Array.from(new Set(tableData.map(r => r.source))).filter(Boolean);

  // Filtering (no CPP filter)
  const filteredData = tableData.filter(r => {
    if (filters.source && r.source !== filters.source) return false;
    if (filters.dateFrom && r.date < filters.dateFrom) return false;
    if (filters.dateTo && r.date > filters.dateTo) return false;
    return true;
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    const { key, dir } = sort;
    let v1 = a[key], v2 = b[key];
    if (key === 'cpp' || key === 'taxes' || key === 'value' || key === 'points') {
      v1 = Number(v1); v2 = Number(v2);
      // Handle NaN for cpp
      if (isNaN(v1)) v1 = -Infinity;
      if (isNaN(v2)) v2 = -Infinity;
    }
    if (v1 < v2) return sort.dir === 'asc' ? -1 : 1;
    if (v1 > v2) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / PAGE_SIZE) || 1;
  const pagedData = sortedData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePageChange = newPage => {
    setPage(newPage);
  };

  useEffect(() => {
    setPage(1); // Reset to first page on filter change
  }, [filters, redemptions]);

  return (
    <div>
      <h2>Redemptions</h2>
      <div style={{ marginBottom: 16 }}>
        <label>Source: 
          <select name="source" value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))} style={{ marginRight: 8 }}>
            <option value="">All</option>
            {sourceOptions.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>Date From: <input type="date" name="dateFrom" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} style={{ marginRight: 8 }} /></label>
        <label>Date To: <input type="date" name="dateTo" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} style={{ marginRight: 8 }} /></label>
      </div>
      {loading ? <p>Loading...</p> : (
        <>
        <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 900 }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} onClick={() => col.key !== 'actions' && handleSort(col.key)} style={{ cursor: col.key !== 'actions' ? 'pointer' : 'default' }}>
                  {col.label}
                  {sort.key === col.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} style={{ padding: 0, border: 'none', background: 'none' }}>
                <button onClick={() => setAdding(true)} style={{ width: '100%', padding: 8, background: '#e6f7ff', border: '1px solid #91d5ff', color: '#1890ff', fontWeight: 'bold', cursor: 'pointer' }}>
                  + Add Redemption
                </button>
              </td>
            </tr>
            {pagedData.map(r => editingId === r.id ? (
              <tr key={r.id} style={{ background: '#f9f9f9' }}>
                <td><input type="date" name="date" value={editForm.date} onChange={handleEditChange} /></td>
                <td>
                  <select name="source" value={editForm.source} onChange={handleEditChange}>
                    <option value="">Select Source</option>
                    {sourceOptions.map(group => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </td>
                <td><input type="number" name="points" value={editForm.points} onChange={handleEditChange} min="1" /></td>
                <td><input type="number" name="taxes" value={editForm.taxes} onChange={handleEditChange} min="0" step="0.01" /></td>
                <td><input type="number" name="value" value={editForm.value} onChange={handleEditChange} min="0.01" step="0.01" /></td>
                <td>{editForm.points > 0 && editForm.value !== '' && editForm.taxes !== '' ? (((editForm.value - editForm.taxes) / editForm.points) * 100).toFixed(1) + '¢/pt' : ''}</td>
                <td><input type="text" name="notes" value={editForm.notes} onChange={handleEditChange} /></td>
                <td>
                  <button onClick={() => handleEditSave(r.id)} style={{ color: 'green', marginRight: 4 }}>Save</button>
                  <button onClick={handleEditCancel} style={{ color: 'gray' }}>Cancel</button>
                </td>
              </tr>
            ) : (
              <tr key={r.id}>
                <td>{r.date}</td>
                <td>{r.source}</td>
                <td>{r.points}</td>
                <td>{usd(r.taxes)}</td>
                <td>{usd(r.value)}</td>
                <td>{r.cpp !== '' ? Number(r.cpp).toFixed(1) + '¢/pt' : ''}</td>
                <td>{r.notes}</td>
                <td>
                  <button onClick={() => handleEdit(r)} style={{ marginRight: 4, background: 'none', border: 'none', boxShadow: 'none', padding: 0, cursor: 'pointer' }} title="Edit">✏️</button>
                  <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} style={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0, cursor: 'pointer' }} title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>Prev</button>
          <span style={{ margin: '0 8px' }}>Page {page} of {totalPages}</span>
          <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>Next</button>
        </div>
        </>
      )}
      {/* Add Redemption Modal */}
      <Modal open={adding} onClose={handleAddCancel}>
        <h3 style={{ marginTop: 0 }}>Add Redemption</h3>
        <form onSubmit={e => { e.preventDefault(); handleAddSave(); }}>
          <div style={{ marginBottom: 12 }}>
            <label>Date{<RequiredAsterisk />}<br />
              <input type="date" name="date" value={addForm.date} onChange={handleAddChange} />
            </label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Source{<RequiredAsterisk />}<br />
              <select name="source" value={addForm.source} onChange={handleAddChange}>
                <option value="">Select Source</option>
                {sourceOptions.map(group => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Points Used{<RequiredAsterisk />}<br />
              <input type="number" name="points" value={addForm.points} onChange={handleAddChange} min="1" />
            </label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Additional Taxes/Fees Paid ($)<br />
              <input type="number" name="taxes" value={addForm.taxes} onChange={handleAddChange} min="0" step="0.01" />
            </label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Total Cash Value ($){<RequiredAsterisk />}<br />
              <input type="number" name="value" value={addForm.value} onChange={handleAddChange} min="0.01" step="0.01" />
            </label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Notes<br />
              <input type="text" name="notes" value={addForm.notes} onChange={handleAddChange} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button type="submit" disabled={!isAddValid} style={{ color: isAddValid ? 'green' : 'gray' }}>Add</button>
            <button type="button" onClick={handleAddCancel} style={{ color: 'gray' }}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 