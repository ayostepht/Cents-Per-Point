import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, Link } from 'react-router-dom';
import { PlusCircle, Edit2, Trash2, Search, CheckCircle, Download, Save } from 'lucide-react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { MultiSelect } from 'react-multi-select-component';
import API_URL from '../config';
import { sourceOptions } from '../constants/sourceOptions';

const usd = n => n !== '' && n !== null && n !== undefined ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '';

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'source', label: 'Source' },
  { key: 'points', label: 'Points Used' },
  { key: 'taxes', label: 'Taxes/Fees ($)' },
  { key: 'value', label: 'Total Cash Value ($)' },
  { key: 'cpp', label: 'CPP' },
  { key: 'is_travel_credit', label: 'Free Night Award/Credit' },
  { key: 'trip', label: 'Trip' },
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

// Prepare options for MultiSelect
const sourceMultiOptions = sourceOptions.flatMap(group => group.options.map(opt => ({ label: opt, value: opt })));

export default function Redemptions() {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' });
  const [deleting, setDeleting] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filters, setFilters] = useState({ source: [], dateFrom: '', dateTo: '', search: '', trip: [] });
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({ date: todayStr(), source: '', points: '', taxes: '', value: '', notes: '', is_travel_credit: false, trip_id: null });
  const [cppRange, setCppRange] = useState([0, 10]);
  const [trips, setTrips] = useState([]);
  const [addingTripInline, setAddingTripInline] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [editingTripInline, setEditingTripInline] = useState(false);
  const [editNewTripName, setEditNewTripName] = useState('');
  const CPP_MIN = 0;
  const CPP_MAX = 10;

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sourceParam = params.get('source');
    if (sourceParam) {
      setFilters(f => ({ ...f, source: sourceParam.split(',') }));
    }
    // eslint-disable-next-line
  }, [location.search]);

  useEffect(() => {
    fetchRedemptions();
  }, []);

  const fetchRedemptions = () => {
    setLoading(true);
    axios.get(`${API_URL}/api/redemptions`)
      .then(res => {
        setRedemptions(res.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching redemptions:', error);
        setLoading(false);
      });
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
      await axios.delete(`${API_URL}/api/redemptions/${id}`);
      fetchRedemptions();
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = r => {
    setEditingId(r.id);
    setEditForm({
      date: new Date(r.date).toISOString().split('T')[0],
      source: r.source,
      points: r.points,
      taxes: r.taxes,
      value: r.value,
      notes: r.notes,
      is_travel_credit: !!r.is_travel_credit,
      trip_id: r.trip_id
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

  const handleEditTripDropdownChange = (e) => {
    if (e.target.value === '__add_new__') {
      setEditingTripInline(true);
      setEditForm(prev => ({ ...prev, trip_id: null }));
      setEditNewTripName('');
    } else {
      setEditingTripInline(false);
      setEditNewTripName('');
      setEditForm(prev => ({ ...prev, trip_id: e.target.value ? Number(e.target.value) : null }));
    }
  };

  const handleEditSave = async id => {
    // Check if creating new trip and validate
    if (editingTripInline && !editNewTripName.trim()) {
      alert('Please enter a name for the new trip or select an existing trip.');
      return;
    }

    try {
      let tripId = editForm.trip_id;
      
      // If adding a new trip, create it first
      if (editingTripInline && editNewTripName.trim()) {
        const tripResponse = await axios.post(`${API_URL}/api/trips`, {
          name: editNewTripName.trim(),
          description: ''
        });
        tripId = tripResponse.data.id;
      }

      await axios.put(`${API_URL}/api/redemptions/${id}`, {
        date: editForm.date,
        source: editForm.source,
        points: editForm.is_travel_credit ? 0 : Number(editForm.points),
        value: Number(editForm.value),
        taxes: Number(editForm.taxes),
        notes: editForm.notes,
        is_travel_credit: editForm.is_travel_credit,
        trip_id: tripId
      });
      
      setEditingId(null);
      setEditingTripInline(false);
      setEditNewTripName('');
      // Refresh both redemptions and trips lists to ensure new data is shown
      await fetchRedemptions();
      await fetchTrips();
    } catch (error) {
      console.error('Error saving redemption:', error);
      alert('Error saving redemption: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingTripInline(false);
    setEditNewTripName('');
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
  const missingFields = requiredFields.filter(f => !addForm[f.key]);
  
  // Separate validation for points field based on free night award status
  const isPointsValid = addForm.is_travel_credit || (!addForm.is_travel_credit && Number(addForm.points) > 0);
  const isAddValid = missingFields.length === 0 && isPointsValid;

  // Validation for edit form
  const editMissingFields = requiredFields.filter(f => !editForm[f.key]);
  const isEditPointsValid = editForm.is_travel_credit || (!editForm.is_travel_credit && Number(editForm.points) > 0);
  const isEditValid = editMissingFields.length === 0 && isEditPointsValid;

  const handleAddSave = async () => {
    if (!isAddValid) {
      alert('Please complete the following required fields: ' + missingFields.map(f => f.label).join(', '));
      return;
    }

    // Check if creating new trip and validate
    if (addingTripInline && !newTripName.trim()) {
      alert('Please enter a name for the new trip or select an existing trip.');
      return;
    }
    
    try {
      let tripId = addForm.trip_id;
      
      // If adding a new trip, create it first
      if (addingTripInline && newTripName.trim()) {
        const tripResponse = await axios.post(`${API_URL}/api/trips`, {
          name: newTripName.trim(),
          description: ''
        });
        tripId = tripResponse.data.id;
      }
      
      const redemptionData = {
        date: addForm.date,
        source: addForm.source,
        points: addForm.is_travel_credit ? 0 : Number(addForm.points),
        value: Number(addForm.value),
        taxes: Number(addForm.taxes),
        notes: addForm.notes,
        is_travel_credit: addForm.is_travel_credit,
        trip_id: tripId
      };
      
      const response = await axios.post(`${API_URL}/api/redemptions`, redemptionData);
      
      setAddForm({ date: todayStr(), source: '', points: '', taxes: '', value: '', notes: '', is_travel_credit: false, trip_id: null });
      setAdding(false);
      setAddingTripInline(false);
      setNewTripName('');
      // Refresh both redemptions and trips lists to ensure new data is shown
      await fetchRedemptions();
      await fetchTrips();
    } catch (error) {
      console.error('Error saving redemption:', error);
      alert('Error saving redemption: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddCancel = () => {
    setAddForm({ date: todayStr(), source: '', points: '', taxes: '', value: '', notes: '', is_travel_credit: false, trip_id: null });
    setAdding(false);
    setAddingTripInline(false);
    setNewTripName('');
  };

  // Prepare data with cpp calculated
  const tableData = redemptions.map(r => {
    let cpp = '';
    if (r.is_travel_credit) {
      cpp = 'N/A';
    } else if (r.points > 0) {
      cpp = ((r.value - (r.taxes || 0)) / r.points * 100).toFixed(1);
    }
    return { ...r, cpp };
  });

  // Unique sources for dropdown
  const uniqueSources = Array.from(new Set(tableData.map(r => r.source))).filter(Boolean);

  // Filtering
  const filteredData = tableData.filter(r => {
    if (filters.source.length > 0 && !filters.source.includes(r.source)) return false;
    if (filters.dateFrom && r.date < filters.dateFrom) return false;
    if (filters.dateTo && r.date > filters.dateTo) return false;
    if (filters.trip.length > 0 && !filters.trip.includes(r.trip_id)) return false;
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

  // Fetch trips
  const fetchTrips = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/trips`);
      setTrips(response.data);
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleTripDropdownChange = (e) => {
    if (e.target.value === '__add_new__') {
      setAddingTripInline(true);
      setAddForm(prev => ({ ...prev, trip_id: null }));
      setNewTripName('');
    } else {
      setAddingTripInline(false);
      setNewTripName('');
      setAddForm(prev => ({ ...prev, trip_id: e.target.value ? Number(e.target.value) : null }));
    }
  };


  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tight">My Redemptions</h2>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-end mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Source</label>
              <MultiSelect
                options={sourceMultiOptions}
                value={filters.source.map(val => sourceMultiOptions.find(opt => opt.value === val)).filter(Boolean)}
                onChange={selected => setFilters(f => ({ ...f, source: selected.map(opt => opt.value) }))}
                labelledBy="Select Source"
                className="min-w-[180px]"
                hasSelectAll={false}
                overrideStrings={{ selectSomeItems: 'Select Source(s)', allItemsAreSelected: 'All Sources', search: 'Search...' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date From</label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="border border-gray-300 rounded-lg p-2 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 min-w-[120px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date To</label>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="border border-gray-300 rounded-lg p-2 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 min-w-[120px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Trip</label>
              <MultiSelect
                options={trips.map(trip => ({ label: trip.name, value: trip.id }))}
                value={filters.trip.map(id => ({ label: trips.find(t => t.id === id)?.name, value: id })).filter(Boolean)}
                onChange={selected => setFilters(f => ({ ...f, trip: selected.map(opt => opt.value) }))}
                labelledBy="Select Trip"
                className="min-w-[180px]"
                hasSelectAll={false}
                overrideStrings={{ selectSomeItems: 'Select Trip(s)', allItemsAreSelected: 'All Trips', search: 'Search...' }}
              />
            </div>
            <button
              onClick={() => {
                setFilters(f => ({ ...f, source: [], dateFrom: '', dateTo: '', trip: [] }));
              }}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold mt-5"
              type="button"
            >
              Clear Filters
            </button>
            <div className="flex gap-3 ml-auto mt-5">
              <Link
                to="/import-export"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow text-lg"
              >
                <Download size={22} /> Import/Export
              </Link>
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow text-lg"
                type="button"
              >
                <PlusCircle size={22} /> Add New Redemption
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-xl shadow overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  {[
                    { key: 'date', label: 'Date' },
                    { key: 'source', label: 'Source' },
                    { key: 'points', label: 'Total Points' },
                    { key: 'taxes', label: 'Taxes/Fees' },
                    { key: 'value', label: 'Cash Value' },
                    { key: 'cpp', label: 'CPP (¢)' },
                    { key: 'is_travel_credit', label: 'Free Night Award/Credit' },
                    { key: 'trip', label: 'Trip' },
                    { key: 'notes', label: 'Notes' },
                    { key: 'actions', label: 'Actions' },
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => col.key !== 'actions' && handleSort(col.key)}
                      className={
                        'px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider' +
                        (col.key !== 'actions' ? ' cursor-pointer select-none' : '')
                      }
                      style={{ userSelect: 'none' }}
                    >
                      {col.label}
                      {sort.key === col.key ? (
                        <span className="ml-1">{sort.dir === 'asc' ? '▲' : '▼'}</span>
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedData.map(r => editingId === r.id ? (
                  <tr key={r.id} className="bg-gray-50">
                    <td><input type="date" name="date" value={editForm.date} onChange={handleEditChange} className="border border-gray-300 rounded-lg p-2 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></td>
                    <td>
                      <select name="source" value={editForm.source} onChange={handleEditChange} className="border border-gray-300 rounded-lg p-2 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
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
                    <td><input type="number" name="points" value={editForm.points} onChange={handleEditChange} min={editForm.is_travel_credit ? 0 : 1} className="border border-gray-300 rounded-lg p-2 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></td>
                    <td><input type="number" name="taxes" value={editForm.taxes} onChange={handleEditChange} min="0" step="0.01" className="border border-gray-300 rounded-lg p-2 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></td>
                    <td><input type="number" name="value" value={editForm.value} onChange={handleEditChange} min="0.01" step="0.01" className="border border-gray-300 rounded-lg p-2 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></td>
                    <td>{editForm.is_travel_credit ? 'N/A' : (editForm.points > 0 && editForm.value !== '' && editForm.taxes !== '' ? (((editForm.value - editForm.taxes) / editForm.points) * 100).toFixed(1) + '¢/pt' : '')}</td>
                    <td className="text-center">
                      <input 
                        type="checkbox" 
                        name="is_travel_credit" 
                        checked={!!editForm.is_travel_credit} 
                        onChange={handleEditChange} 
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                      />
                    </td>
                    <td>
                      <div>
                        <select 
                          value={editingTripInline ? '__add_new__' : editForm.trip_id || ''} 
                          onChange={handleEditTripDropdownChange} 
                          className="border border-gray-300 rounded-lg p-2 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">No Trip</option>
                          {trips.map(trip => (
                            <option key={trip.id} value={trip.id}>{trip.name}</option>
                          ))}
                          <option value="__add_new__">Add new trip…</option>
                        </select>
                        {editingTripInline && (
                          <input
                            type="text"
                            placeholder="Enter new trip name"
                            value={editNewTripName}
                            onChange={e => setEditNewTripName(e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-100 mt-1"
                          />
                        )}
                      </div>
                    </td>
                    <td><input type="text" name="notes" value={editForm.notes} onChange={handleEditChange} className="border border-gray-300 rounded-lg p-2 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium flex gap-2 items-center">
                      <button onClick={() => handleEditSave(r.id)} className="text-green-600" title="Save"><Save size={18} /></button>
                      <button onClick={handleEditCancel} className="text-gray-500">Cancel</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{r.source}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{r.points.toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{usd(r.taxes)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{usd(r.value)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-black">{r.cpp !== '' ? r.cpp : ''}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {r.is_travel_credit ? <CheckCircle size={20} className="inline text-blue-600 font-bold" /> : <span className="text-gray-400 font-bold">-</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {trips.find(t => t.id === r.trip_id)?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={r.notes}>{r.notes || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium flex gap-2 items-center">
                      <button onClick={() => handleEdit(r)} className="text-blue-600 hover:text-blue-800 transition duration-150" title="Edit"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} className="text-red-600 hover:text-red-800 transition duration-150" title="Delete"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Modal open={adding || editingId !== null} onClose={editingId !== null ? handleEditCancel : handleAddCancel}>
        <h2 className="text-2xl font-bold mb-4">{editingId !== null ? 'Edit Redemption' : 'Add Redemption'}</h2>
        <form onSubmit={e => { e.preventDefault(); editingId !== null ? handleEditSave(editingId) : handleAddSave(); }} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Date<RequiredAsterisk /><br />
              <input type="date" name="date" value={editingId !== null ? editForm.date : addForm.date} onChange={editingId !== null ? handleEditChange : handleAddChange} className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
          </div>
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Source<RequiredAsterisk /><br />
              <select name="source" value={editingId !== null ? editForm.source : addForm.source} onChange={editingId !== null ? handleEditChange : handleAddChange} className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
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
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Total Points{!editingId !== null && !addForm.is_travel_credit && <RequiredAsterisk />}<br />
              <input type="number" name="points" value={editingId !== null ? editForm.points : addForm.points} onChange={editingId !== null ? handleEditChange : handleAddChange} min={editingId !== null ? (editForm.is_travel_credit ? 0 : 1) : (addForm.is_travel_credit ? 0 : 1)} className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
          </div>
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Taxes/Fees (USD)<br />
              <input type="number" name="taxes" value={editingId !== null ? editForm.taxes : addForm.taxes} onChange={editingId !== null ? handleEditChange : handleAddChange} min="0" step="0.01" className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
          </div>
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Cash Value (USD)<RequiredAsterisk /><br />
              <input type="number" name="value" value={editingId !== null ? editForm.value : addForm.value} onChange={editingId !== null ? handleEditChange : handleAddChange} min="0.01" step="0.01" className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="is_travel_credit"
              name="is_travel_credit" 
              checked={editingId !== null ? !!editForm.is_travel_credit : !!addForm.is_travel_credit} 
              onChange={editingId !== null ? handleEditChange : handleAddChange} 
              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
            />
            <label htmlFor="is_travel_credit" className="text-gray-700 font-medium">Free Night Award/Credit</label>
          </div>
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Notes<br />
              <input type="text" name="notes" value={editingId !== null ? editForm.notes : addForm.notes} onChange={editingId !== null ? handleEditChange : handleAddChange} className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Trip</label>
            <div>
              {editingId !== null ? (
                <div>
                  <select
                    value={editingTripInline ? '__add_new__' : editForm.trip_id || ''}
                    onChange={handleEditTripDropdownChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">No Trip</option>
                    {trips.map(trip => (
                      <option key={trip.id} value={trip.id}>
                        {trip.name}
                      </option>
                    ))}
                    <option value="__add_new__">Add new trip…</option>
                  </select>
                  {editingTripInline && (
                    <input
                      type="text"
                      placeholder="Enter new trip name"
                      value={editNewTripName}
                      onChange={e => setEditNewTripName(e.target.value)}
                      className="w-full p-2 border rounded mt-2"
                    />
                  )}
                </div>
              ) : (
                <div>
                  <select
                    value={addingTripInline ? '__add_new__' : addForm.trip_id || ''}
                    onChange={handleTripDropdownChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">No Trip</option>
                    {trips.map(trip => (
                      <option key={trip.id} value={trip.id}>
                        {trip.name}
                      </option>
                    ))}
                    <option value="__add_new__">Add new trip…</option>
                  </select>
                  {addingTripInline && (
                    <input
                      type="text"
                      placeholder="Enter new trip name"
                      value={newTripName}
                      onChange={e => setNewTripName(e.target.value)}
                      className="w-full p-2 border rounded mt-2"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-6 justify-end">
            <button type="button" onClick={editingId !== null ? handleEditCancel : handleAddCancel} className="px-5 py-3 rounded-xl bg-gray-200 text-gray-700 font-bold">Cancel</button>
            <button type="submit" disabled={editingId !== null ? !isEditValid : !isAddValid} className={"px-5 py-3 rounded-xl font-bold " + ((editingId !== null ? isEditValid : isAddValid) ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed')}>{editingId !== null ? 'Save' : 'Add Redemption'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 