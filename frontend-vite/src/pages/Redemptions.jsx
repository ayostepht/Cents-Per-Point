import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const usd = n => n !== '' && n !== null && n !== undefined ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '';

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'source', label: 'Source' },
  { key: 'points', label: 'Points Used' },
  { key: 'taxes', label: 'Taxes/Fees ($)' },
  { key: 'value', label: 'Total Cash Value ($)' },
  { key: 'cpp', label: 'CPP' },
  { key: 'is_travel_credit', label: 'Free Night Award/Credit' },
  { key: 'notes', label: 'Notes' },
  { key: 'actions', label: 'Actions' }
];

const PAGE_SIZE = 25;

const todayStr = () => new Date().toISOString().slice(0, 10);

const RequiredAsterisk = () => (
  <span className="text-red-500 ml-1" title="Required" aria-label="Required">*</span>
);

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 min-w-[340px] shadow-2xl relative">
        <button onClick={onClose} className="absolute top-3 right-4 text-2xl text-gray-400 hover:text-gray-600">&times;</button>
        {children}
      </div>
    </div>
  );
}

const sourceOptions = [
  {
    label: 'Credit Card',
    options: [ 'Chase', 'Amex', 'Citi', 'Bilt', 'Capital One' ].sort()
  },
  {
    label: 'Airline',
    options: [ 'American Airlines', 'Delta', 'Southwest', 'United', 'Alaskan Air' ].sort()
  },
  {
    label: 'Hotel',
    options: [ 'Hyatt', 'Hilton', 'Marriott', 'IHG' ].sort()
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
  const [addForm, setAddForm] = useState({ date: todayStr(), source: '', points: '', taxes: '', value: '', notes: '', is_travel_credit: false });

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
    axios.get('http://localhost:5000/api/redemptions')
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
      await axios.delete(`http://localhost:5000/api/redemptions/${id}`);
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
      notes: r.notes,
      is_travel_credit: !!r.is_travel_credit
    });
  };

  const handleEditChange = e => {
    const { name, value, type, checked } = e.target;
    setEditForm(f => {
      if (name === 'is_travel_credit') {
        return { ...f, is_travel_credit: checked, points: checked && (!f.points || f.points === '') ? 0 : f.points };
      }
      return { ...f, [name]: type === 'checkbox' ? checked : value };
    });
  };

  const handleEditSave = async id => {
    await axios.put(`http://localhost:5000/api/redemptions/${id}`, {
      date: editForm.date,
      source: editForm.source,
      points: editForm.is_travel_credit ? 0 : Number(editForm.points),
      value: Number(editForm.value),
      taxes: Number(editForm.taxes),
      notes: editForm.notes,
      is_travel_credit: editForm.is_travel_credit
    });
    setEditingId(null);
    fetchRedemptions();
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const handleAddChange = e => {
    const { name, value, type, checked } = e.target;
    setAddForm(f => {
      if (name === 'is_travel_credit') {
        return { ...f, is_travel_credit: checked, points: checked && (!f.points || f.points === '') ? 0 : f.points };
      }
      return { ...f, [name]: type === 'checkbox' ? checked : value };
    });
  };

  // Validation for add form
  const requiredFields = [
    { key: 'date', label: 'Date' },
    { key: 'source', label: 'Source' },
    { key: 'value', label: 'Total Cash Value ($)' }
  ];
  const missingFields = requiredFields.filter(f => !addForm[f.key] || (f.key === 'points' && !addForm.is_travel_credit && Number(addForm[f.key]) === 0));
  const isAddValid = missingFields.length === 0 && (addForm.is_travel_credit || Number(addForm.points) > 0);

  const handleAddSave = async () => {
    if (!isAddValid) {
      alert('Please complete the following required fields: ' + missingFields.map(f => f.label).join(', '));
      return;
    }
    await axios.post('http://localhost:5000/api/redemptions', {
      date: addForm.date,
      source: addForm.source,
      points: addForm.is_travel_credit ? 0 : Number(addForm.points),
      value: Number(addForm.value),
      taxes: Number(addForm.taxes),
      notes: addForm.notes,
      is_travel_credit: addForm.is_travel_credit
    });
    setAddForm({ date: todayStr(), source: '', points: '', taxes: '', value: '', notes: '', is_travel_credit: false });
    setAdding(false);
    fetchRedemptions();
  };

  const handleAddCancel = () => {
    setAddForm({ date: todayStr(), source: '', points: '', taxes: '', value: '', notes: '', is_travel_credit: false });
    setAdding(false);
  };

  // Prepare data with cpp calculated
  const tableData = redemptions.map(r => {
    let cpp = '';
    if (r.is_travel_credit) {
      cpp = ((r.value - (r.taxes || 0)) * 100).toFixed(1);
    } else if (r.points > 0) {
      cpp = ((r.value - (r.taxes || 0)) / r.points * 100).toFixed(1);
    }
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
      <h2 className="text-2xl font-bold mb-4">Redemptions</h2>
      <div className="mb-4 flex flex-wrap gap-4 items-end">
        <label className="font-medium">Source:
          <select name="source" value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))} className="ml-2 mr-4 border rounded p-1">
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
        <label className="font-medium">Date From:
          <input type="date" name="dateFrom" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} className="ml-2 mr-4 border rounded p-1" />
        </label>
        <label className="font-medium">Date To:
          <input type="date" name="dateTo" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} className="ml-2 border rounded p-1" />
        </label>
      </div>
      {loading ? <p>Loading...</p> : (
        <>
        <table className="w-full border-collapse max-w-3xl mx-auto bg-white rounded-lg shadow overflow-hidden">
          <thead>
            <tr className="bg-gray-100">
              {columns.map(col => (
                <th key={col.key} onClick={() => col.key !== 'actions' && handleSort(col.key)} className={col.key !== 'actions' ? 'cursor-pointer' : ''}>
                  {col.label}
                  {sort.key === col.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="p-0 border-none bg-none">
                <button onClick={() => setAdding(true)} className="w-full py-2 bg-blue-50 border border-blue-200 text-blue-700 font-bold cursor-pointer">+ Add Redemption</button>
              </td>
            </tr>
            {pagedData.map(r => editingId === r.id ? (
              <tr key={r.id} className="bg-gray-50">
                <td><input type="date" name="date" value={editForm.date} onChange={handleEditChange} className="border rounded p-1" /></td>
                <td>
                  <select name="source" value={editForm.source} onChange={handleEditChange} className="border rounded p-1">
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
                <td><input type="number" name="points" value={editForm.points} onChange={handleEditChange} min={editForm.is_travel_credit ? 0 : 1} className="border rounded p-1" /></td>
                <td><input type="number" name="taxes" value={editForm.taxes} onChange={handleEditChange} min="0" step="0.01" className="border rounded p-1" /></td>
                <td><input type="number" name="value" value={editForm.value} onChange={handleEditChange} min="0.01" step="0.01" className="border rounded p-1" /></td>
                <td>{editForm.is_travel_credit ? ((editForm.value - editForm.taxes) * 100).toFixed(1) + '¢' : (editForm.points > 0 && editForm.value !== '' && editForm.taxes !== '' ? (((editForm.value - editForm.taxes) / editForm.points) * 100).toFixed(1) + '¢/pt' : '')}</td>
                <td>
                  <input type="checkbox" name="is_travel_credit" checked={!!editForm.is_travel_credit} onChange={handleEditChange} />
                </td>
                <td><input type="text" name="notes" value={editForm.notes} onChange={handleEditChange} className="border rounded p-1" /></td>
                <td>
                  <button onClick={() => handleEditSave(r.id)} className="text-green-600 mr-2">Save</button>
                  <button onClick={handleEditCancel} className="text-gray-500">Cancel</button>
                </td>
              </tr>
            ) : (
              <tr key={r.id}>
                <td>{r.date}</td>
                <td>{r.source}</td>
                <td>{r.points}</td>
                <td>{usd(r.taxes)}</td>
                <td>{usd(r.value)}</td>
                <td>{r.cpp !== '' ? r.cpp + (r.is_travel_credit ? '¢' : '¢/pt') : ''}</td>
                <td><input type="checkbox" checked={!!r.is_travel_credit} readOnly /></td>
                <td>{r.notes}</td>
                <td>
                  <button onClick={() => handleEdit(r)} className="mr-2 text-blue-600 hover:underline" title="Edit">✏️</button>
                  <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} className="text-red-600 hover:underline" title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-center items-center gap-4">
          <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Next</button>
        </div>
        </>
      )}
      {/* Add Redemption Modal */}
      <Modal open={adding} onClose={handleAddCancel}>
        <h3 className="text-lg font-bold mb-4 mt-0">Add Redemption</h3>
        <form onSubmit={e => { e.preventDefault(); handleAddSave(); }}>
          <div className="mb-3">
            <label className="block">Date{<RequiredAsterisk />}<br />
              <input type="date" name="date" value={addForm.date} onChange={handleAddChange} className="border rounded p-1 w-full" />
            </label>
          </div>
          <div className="mb-3">
            <label className="block">Source{<RequiredAsterisk />}<br />
              <select name="source" value={addForm.source} onChange={handleAddChange} className="border rounded p-1 w-full">
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
          <div className="mb-3">
            <label className="block">Points Used{!addForm.is_travel_credit && <RequiredAsterisk />}<br />
              <input type="number" name="points" value={addForm.points} onChange={handleAddChange} min={addForm.is_travel_credit ? 0 : 1} className="border rounded p-1 w-full" />
            </label>
          </div>
          <div className="mb-3">
            <label className="block">Additional Taxes/Fees Paid ($)<br />
              <input type="number" name="taxes" value={addForm.taxes} onChange={handleAddChange} min="0" step="0.01" className="border rounded p-1 w-full" />
            </label>
          </div>
          <div className="mb-3">
            <label className="block">Total Cash Value ($){<RequiredAsterisk />}<br />
              <input type="number" name="value" value={addForm.value} onChange={handleAddChange} min="0.01" step="0.01" className="border rounded p-1 w-full" />
            </label>
          </div>
          <div className="mb-3">
            <label className="block"><input type="checkbox" name="is_travel_credit" checked={!!addForm.is_travel_credit} onChange={handleAddChange} /> Free Night Award/Credit</label>
          </div>
          <div className="mb-3">
            <label className="block">Notes<br />
              <input type="text" name="notes" value={addForm.notes} onChange={handleAddChange} className="border rounded p-1 w-full" />
            </label>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={!isAddValid} className={"px-4 py-2 rounded font-bold " + (isAddValid ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed')}>Add</button>
            <button type="button" onClick={handleAddCancel} className="px-4 py-2 rounded bg-gray-200 text-gray-700">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 