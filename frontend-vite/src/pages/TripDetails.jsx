import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { Plane, Edit2, Trash2, PlusCircle, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';
import { sourceOptions } from '../constants/sourceOptions';
import axios from 'axios';
import { MultiSelect } from 'react-multi-select-component';

const usd = n => n !== '' && n !== null && n !== undefined ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '';
const todayStr = () => new Date().toISOString().slice(0, 10);

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString();
};

const formatDateRange = (start, end) => {
  const opts = { year: 'numeric', month: 'short', day: 'numeric' };
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  if (s && e && !isNaN(s) && !isNaN(e)) {
    return `${s.toLocaleDateString(undefined, opts)} - ${e.toLocaleDateString(undefined, opts)}`;
  } else if (s && !isNaN(s)) {
    return s.toLocaleDateString(undefined, opts);
  } else if (e && !isNaN(e)) {
    return e.toLocaleDateString(undefined, opts);
  }
  return '';
};

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [stats, setStats] = useState(null);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [addRedemptionModal, setAddRedemptionModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', image: '', start_date: '', end_date: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [addRedemptionForm, setAddRedemptionForm] = useState({ date: todayStr(), source: '', points: '', taxes: '', value: '', notes: '', is_travel_credit: false });
  const [addRedemptionLoading, setAddRedemptionLoading] = useState(false);
  const [editImageFile, setEditImageFile] = useState(null);
  const [deleteRedemptionsChoice, setDeleteRedemptionsChoice] = useState(null);
  // Filter/sort state
  const [filters, setFilters] = useState({ source: [], dateFrom: '', dateTo: '' });
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' });

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const tripRes = await fetch(`${API_BASE_URL}/api/trips/${id}`);
      const tripData = await tripRes.json();
      setTrip(tripData);
      setEditForm({
        name: tripData.name || '',
        description: tripData.description || '',
        image: tripData.image || '',
        start_date: tripData.start_date || '',
        end_date: tripData.end_date || '',
      });
      const statsRes = await fetch(`${API_BASE_URL}/api/trips/${id}/stats`);
      setStats(await statsRes.json());
      const redRes = await fetch(`${API_BASE_URL}/api/redemptions/trip/${id}`);
      setRedemptions(await redRes.json());
      setLoading(false);
    }
    fetchAll();
  }, [id]);

  // Filtering and sorting logic for redemptions
  const uniqueSources = Array.from(new Set(redemptions.map(r => r.source))).filter(Boolean);
  let filteredRedemptions = redemptions.filter(r => {
    if (filters.source.length > 0 && !filters.source.includes(r.source)) return false;
    if (filters.dateFrom && r.date < filters.dateFrom) return false;
    if (filters.dateTo && r.date > filters.dateTo) return false;
    return true;
  });
  filteredRedemptions = [...filteredRedemptions].sort((a, b) => {
    const { key, dir } = sort;
    let v1 = a[key], v2 = b[key];
    if (key === 'date') {
      v1 = new Date(v1);
      v2 = new Date(v2);
    } else if (key === 'value' || key === 'points' || key === 'taxes') {
      v1 = Number(v1);
      v2 = Number(v2);
    }
    if (v1 < v2) return dir === 'asc' ? -1 : 1;
    if (v1 > v2) return dir === 'asc' ? 1 : -1;
    return 0;
  });

  // Calculate average CPP as (sum(value - taxes) / sum(points)) * 100
  const totalValueMinusTaxes = redemptions.reduce((sum, r) => sum + (Number(r.value) - Number(r.taxes || 0)), 0);
  const totalPoints = redemptions.reduce((sum, r) => sum + Number(r.points), 0);
  const avgCpp = totalPoints > 0 ? (totalValueMinusTaxes / totalPoints) * 100 : null;

  // Edit trip handlers
  const handleEditChange = e => {
    const { name, value, type, files } = e.target;
    if (type === 'file' && files[0]) {
      setEditImageFile(files[0]);
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => setEditForm(f => ({ ...f, image: reader.result }));
      reader.readAsDataURL(files[0]);
    } else {
      setEditForm(f => ({ ...f, [name]: value }));
    }
  };
  const handleEditSubmit = async e => {
    e.preventDefault();
    setEditLoading(true);
    let imageUrl = editForm.image;
    try {
      if (editImageFile) {
        // Upload image file
        const formData = new FormData();
        formData.append('image', editImageFile);
        const uploadRes = await axios.post(`${API_BASE_URL}/api/trips/${id}/upload-image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        imageUrl = uploadRes.data.imageUrl;
      }
      await axios.put(`${API_BASE_URL}/api/trips/${id}`, {
        name: editForm.name,
        description: editForm.description,
        image: imageUrl,
        start_date: editForm.start_date,
        end_date: editForm.end_date,
      });
      setEditModal(false);
      window.location.reload();
    } finally {
      setEditLoading(false);
    }
  };

  // Delete trip
  const handleDelete = async () => {
    if (deleteRedemptionsChoice === 'yes') {
      await axios.delete(`${API_BASE_URL}/api/trips/${id}/redemptions`);
    } else if (deleteRedemptionsChoice === 'no') {
      await axios.patch(`${API_BASE_URL}/api/trips/${id}/redemptions/remove-association`);
    }
    await axios.delete(`${API_BASE_URL}/api/trips/${id}`);
    setDeleteModal(false);
    navigate('/trips');
  };

  // Add redemption handlers
  const handleAddRedemptionChange = e => {
    const { name, value, type, checked } = e.target;
    setAddRedemptionForm(f => {
      if (name === 'is_travel_credit') {
        return { ...f, is_travel_credit: checked, points: checked && (!f.points || f.points === '') ? 0 : f.points };
      }
      return { ...f, [name]: type === 'checkbox' ? checked : value };
    });
  };
  const requiredFields = [ { key: 'date', label: 'Date' }, { key: 'source', label: 'Source' }, { key: 'value', label: 'Total Cash Value ($)' } ];
  const missingFields = requiredFields.filter(f => !addRedemptionForm[f.key]);
  const isPointsValid = addRedemptionForm.is_travel_credit || (!addRedemptionForm.is_travel_credit && Number(addRedemptionForm.points) > 0);
  const isAddValid = missingFields.length === 0 && isPointsValid;
  const handleAddRedemption = async e => {
    e.preventDefault();
    setAddRedemptionLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/redemptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addRedemptionForm, points: addRedemptionForm.is_travel_credit ? 0 : Number(addRedemptionForm.points), value: Number(addRedemptionForm.value), taxes: Number(addRedemptionForm.taxes), trip_id: id }),
      });
      setAddRedemptionModal(false);
      setAddRedemptionForm({ date: todayStr(), source: '', points: '', taxes: '', value: '', notes: '', is_travel_credit: false });
      window.location.reload();
    } finally {
      setAddRedemptionLoading(false);
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-6 py-8">Loading...</div>;
  if (!trip) return <div className="max-w-7xl mx-auto px-6 py-8">Trip not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <button onClick={() => navigate('/trips')} className="mb-6 text-blue-600 hover:underline">&larr; Back to Trips</button>
      <div className="flex flex-col md:flex-row gap-8 mb-8 items-center md:items-start">
        {trip.image ? (
          <img 
            src={`${API_BASE_URL}${trip.image}`} 
            alt={trip.name} 
            className="w-64 h-40 object-cover rounded-lg bg-gray-100"
            onError={(e) => {
              console.error('Image failed to load:', e.target.src);
              console.error('API_BASE_URL:', API_BASE_URL);
              console.error('trip.image:', trip.image);
            }}
          />
        ) : (
          <div className="w-64 h-40 flex items-center justify-center rounded-lg bg-gray-100"><Plane size={64} className="text-blue-400" /></div>
        )}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold mb-1">{trip.name}</h1>
              <p className="text-gray-600 mb-2">{trip.description}</p>
              <div className="text-gray-500 text-sm mb-2">
                {(trip.start_date || trip.end_date) && (
                  <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={() => setEditModal(true)}><Edit2 size={18}/> Edit</button>
              <button className="flex items-center gap-1 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700" onClick={() => { setDeleteRedemptionsChoice(null); setDeleteModal(true); }}><Trash2 size={18}/> Delete</button>
              <button className="flex items-center gap-1 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700" onClick={() => setAddRedemptionModal(true)}><PlusCircle size={18}/> Add Redemption</button>
            </div>
          </div>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="text-sm font-medium text-gray-500">Total Redemptions</h3>
                <p className="text-2xl font-semibold">{stats.total_redemptions}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
                <p className="text-2xl font-semibold">{usd(Number(stats.total_value))}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="text-sm font-medium text-gray-500">Total Points</h3>
                <p className="text-2xl font-semibold">{Number(stats.total_points).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="text-sm font-medium text-gray-500">Average CPP</h3>
                <p className="text-2xl font-semibold">{avgCpp !== null ? avgCpp.toFixed(2) + ' ¢' : '--'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-4">Redemptions</h2>
      {/* Filter and sort bar */}
      <div className="bg-gray-50 rounded-xl shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Source</label>
            <MultiSelect
              options={uniqueSources.map(source => ({ label: source, value: source }))}
              value={filters.source.map(source => ({ label: source, value: source }))}
              onChange={selected => setFilters(f => ({ ...f, source: selected.map(opt => opt.value) }))}
              labelledBy="Select Source"
              className="min-w-[120px]"
              hasSelectAll={false}
              overrideStrings={{ selectSomeItems: 'Select Source(s)', allItemsAreSelected: 'All Sources', search: 'Search...' }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Sort By</label>
            <select
              value={sort.key + '-' + sort.dir}
              onChange={e => {
                const [key, dir] = e.target.value.split('-');
                setSort({ key, dir });
              }}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="value-desc">Value (High to Low)</option>
              <option value="value-asc">Value (Low to High)</option>
              <option value="points-desc">Points (High to Low)</option>
              <option value="points-asc">Points (Low to High)</option>
            </select>
          </div>
        </div>
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => setFilters({ source: [], dateFrom: '', dateTo: '' })}
            className="px-3 py-1 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxes/Fees</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPP (¢)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRedemptions.map(r => (
              <tr key={r.id}>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{new Date(r.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{r.source}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{r.points}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{usd(r.taxes)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{usd(r.value)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-black">{r.points > 0 ? (((r.value - (r.taxes || 0)) / r.points) * 100).toFixed(2) : 'N/A'}</td>
                <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={r.notes}>{r.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 min-w-[340px] shadow-2xl relative w-full max-w-md">
            <button onClick={() => setEditModal(false)} className="absolute top-3 right-4 text-2xl text-gray-400 hover:text-gray-600">&times;</button>
            <h2 className="text-xl font-bold mb-4">Edit Trip</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Trip Name<br />
                  <input type="text" name="name" value={editForm.name} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" required />
                </label>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Description<br />
                  <textarea name="description" value={editForm.description} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" rows={2} />
                </label>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Start Date<br />
                  <input type="date" name="start_date" value={editForm.start_date || ''} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700">End Date<br />
                  <input type="date" name="end_date" value={editForm.end_date || ''} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Trip Image<br />
                  <input type="file" accept="image/*" onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-2 bg-white shadow-sm" />
                  {editForm.image && <img src={editForm.image} alt="Preview" className="mt-2 w-full h-32 object-cover rounded" />}
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setEditModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 min-w-[340px] shadow-2xl relative w-full max-w-md">
            <button onClick={() => setDeleteModal(false)} className="absolute top-3 right-4 text-2xl text-gray-400 hover:text-gray-600">&times;</button>
            <h2 className="text-xl font-bold mb-4">Delete Trip</h2>
            {deleteRedemptionsChoice === null ? (
              <>
                <p className="mb-4">Delete all redemptions for this trip?</p>
                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" onClick={() => { setDeleteRedemptionsChoice('no'); }} className="px-4 py-2 border rounded">No</button>
                  <button type="button" onClick={() => { setDeleteRedemptionsChoice('yes'); }} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Yes</button>
                </div>
              </>
            ) : (
              <>
                <p>Are you sure you want to delete this trip? This action cannot be undone.</p>
                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" onClick={() => { setDeleteRedemptionsChoice(null); }} className="px-4 py-2 border rounded">Back</button>
                  <button type="button" onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Redemption Modal */}
      {addRedemptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 min-w-[340px] shadow-2xl relative w-full max-w-md">
            <button onClick={() => setAddRedemptionModal(false)} className="absolute top-3 right-4 text-2xl text-gray-400 hover:text-gray-600">&times;</button>
            <h2 className="text-xl font-bold mb-4">Add Redemption</h2>
            <form onSubmit={handleAddRedemption} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Date<span className="text-red-500 ml-1">*</span><br />
                  <input type="date" name="date" value={addRedemptionForm.date} onChange={handleAddRedemptionChange} className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Source<span className="text-red-500 ml-1">*</span><br />
                  <select name="source" value={addRedemptionForm.source} onChange={handleAddRedemptionChange} className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
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
                <label className="block font-semibold mb-1 text-gray-700">Total Points{!addRedemptionForm.is_travel_credit && <span className="text-red-500 ml-1">*</span>}<br />
                  <input type="number" name="points" value={addRedemptionForm.points} onChange={handleAddRedemptionChange} min={addRedemptionForm.is_travel_credit ? 0 : 1} className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Taxes/Fees (USD)<br />
                  <input type="number" name="taxes" value={addRedemptionForm.taxes} onChange={handleAddRedemptionChange} min="0" step="0.01" className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Cash Value (USD)<span className="text-red-500 ml-1">*</span><br />
                  <input type="number" name="value" value={addRedemptionForm.value} onChange={handleAddRedemptionChange} min="0.01" step="0.01" className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="is_travel_credit"
                  name="is_travel_credit" 
                  checked={!!addRedemptionForm.is_travel_credit} 
                  onChange={handleAddRedemptionChange} 
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                />
                <label htmlFor="is_travel_credit" className="text-gray-700 font-medium">Free Night Award/Credit</label>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Notes<br />
                  <input type="text" name="notes" value={addRedemptionForm.notes} onChange={handleAddRedemptionChange} className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Trip</label>
                <input type="text" value={trip.name} disabled className="w-full border border-gray-200 rounded-lg p-3 bg-gray-50 text-gray-500" />
              </div>
              <div className="flex gap-3 mt-6 justify-end">
                <button type="button" onClick={() => setAddRedemptionModal(false)} className="px-5 py-3 rounded-xl bg-gray-200 text-gray-700 font-bold">Cancel</button>
                <button type="submit" disabled={!isAddValid || addRedemptionLoading} className={"px-5 py-3 rounded-xl font-bold " + (isAddValid && !addRedemptionLoading ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed')}>{addRedemptionLoading ? 'Saving...' : 'Add Redemption'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 