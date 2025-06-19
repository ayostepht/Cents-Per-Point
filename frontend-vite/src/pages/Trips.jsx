import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { Plane } from 'lucide-react';
import axios from 'axios';
import { sourceOptions } from '../constants/sourceOptions';
import { useNavigate } from 'react-router-dom';
import { MultiSelect } from 'react-multi-select-component';

const DEFAULT_IMAGE = 'https://via.placeholder.com/300x180?text=Trip+Photo';

const todayStr = () => new Date().toISOString().slice(0, 10);

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripStats, setTripStats] = useState(null);
  const [tripRedemptions, setTripRedemptions] = useState([]);
  const [isAddingTrip, setIsAddingTrip] = useState(false);
  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [isAddingRedemption, setIsAddingRedemption] = useState(false);
  const [newTrip, setNewTrip] = useState({ name: '', description: '', image: '' });
  const [error, setError] = useState(null);
  const [dateFilters, setDateFilters] = useState({ startFrom: '', endTo: '' });
  const [sort, setSort] = useState({ key: 'start_date', dir: 'asc' });
  const [addRedemptionForm, setAddRedemptionForm] = useState({
    date: todayStr(),
    source: '',
    points: '',
    taxes: '',
    value: '',
    notes: '',
    is_travel_credit: false,
  });
  const [addRedemptionLoading, setAddRedemptionLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch all trips
  const fetchTrips = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trips`);
      if (!response.ok) throw new Error('Failed to fetch trips');
      const data = await response.json();
      setTrips(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch trip statistics
  const fetchTripStats = async (tripId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/stats`);
      if (!response.ok) throw new Error('Failed to fetch trip statistics');
      const data = await response.json();
      setTripStats(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch trip redemptions
  const fetchTripRedemptions = async (tripId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/redemptions/trip/${tripId}`);
      if (!response.ok) throw new Error('Failed to fetch trip redemptions');
      const data = await response.json();
      setTripRedemptions(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle trip selection (open modal)
  const handleTripSelect = async (trip) => {
    setSelectedTrip(trip);
    await fetchTripStats(trip.id);
    await fetchTripRedemptions(trip.id);
  };

  // Handle adding a new trip
  const handleAddTrip = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrip),
      });
      if (!response.ok) throw new Error('Failed to add trip');
      await fetchTrips();
      setIsAddingTrip(false);
      setNewTrip({ name: '', description: '', image: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle editing a trip
  const handleEditTrip = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/trips/${selectedTrip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrip),
      });
      if (!response.ok) throw new Error('Failed to update trip');
      await fetchTrips();
      setIsEditingTrip(false);
      setNewTrip({ name: '', description: '', image: '' });
      setSelectedTrip({ ...selectedTrip, ...newTrip });
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle deleting a trip
  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete trip');
      await fetchTrips();
      setSelectedTrip(null);
      setTripStats(null);
      setTripRedemptions([]);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewTrip((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Add Redemption form handlers
  const handleAddRedemptionChange = e => {
    const { name, value, type, checked } = e.target;
    setAddRedemptionForm(f => {
      if (name === 'is_travel_credit') {
        return { ...f, is_travel_credit: checked, points: checked && (!f.points || f.points === '') ? 0 : f.points };
      }
      return { ...f, [name]: type === 'checkbox' ? checked : value };
    });
  };

  const requiredFields = [
    { key: 'date', label: 'Date' },
    { key: 'source', label: 'Source' },
    { key: 'value', label: 'Total Cash Value ($)' }
  ];
  const missingFields = requiredFields.filter(f => !addRedemptionForm[f.key]);
  const isPointsValid = addRedemptionForm.is_travel_credit || (!addRedemptionForm.is_travel_credit && Number(addRedemptionForm.points) > 0);
  const isAddValid = missingFields.length === 0 && isPointsValid;

  const handleAddRedemption = async (e) => {
    e.preventDefault();
    if (!isAddValid) {
      alert('Please complete the following required fields: ' + missingFields.map(f => f.label).join(', '));
      return;
    }
    setAddRedemptionLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/redemptions`, {
        ...addRedemptionForm,
        points: addRedemptionForm.is_travel_credit ? 0 : Number(addRedemptionForm.points),
        value: Number(addRedemptionForm.value),
        taxes: Number(addRedemptionForm.taxes),
        trip_id: selectedTrip.id,
      });
      setIsAddingRedemption(false);
      setAddRedemptionForm({ date: todayStr(), source: '', points: '', taxes: '', value: '', notes: '', is_travel_credit: false });
      await fetchTripRedemptions(selectedTrip.id);
    } catch (error) {
      alert('Error saving redemption: ' + (error.response?.data?.message || error.message));
    } finally {
      setAddRedemptionLoading(false);
    }
  };

  const formatTripDateRange = (start, end) => {
    const opts = { year: '2-digit', month: 'numeric', day: 'numeric' };
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
  const usd = n => n !== '' && n !== null && n !== undefined ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : '';

  // Filter and sort trips
  let displayedTrips = [...trips];
  if (dateFilters.startFrom) {
    displayedTrips = displayedTrips.filter(trip => trip.start_date && trip.start_date >= dateFilters.startFrom);
  }
  if (dateFilters.endTo) {
    displayedTrips = displayedTrips.filter(trip => trip.end_date && trip.end_date <= dateFilters.endTo);
  }
  displayedTrips.sort((a, b) => {
    let v1 = a[sort.key] || '', v2 = b[sort.key] || '';
    if (sort.key === 'name') {
      v1 = v1.toLowerCase();
      v2 = v2.toLowerCase();
    }
    if (v1 < v2) return sort.dir === 'asc' ? -1 : 1;
    if (v1 > v2) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  useEffect(() => {
    fetchTrips();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-8">Trip Management</h1>
      {/* New filter/sort controls */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date From</label>
          <input
            type="date"
            value={dateFilters.startFrom}
            onChange={e => setDateFilters(f => ({ ...f, startFrom: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">End Date To</label>
          <input
            type="date"
            value={dateFilters.endTo}
            onChange={e => setDateFilters(f => ({ ...f, endTo: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Sort By</label>
          <select
            value={sort.key + '-' + sort.dir}
            onChange={e => {
              const [key, dir] = e.target.value.split('-');
              setSort({ key, dir });
            }}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
          >
            <option value="start_date-asc">Start Date (Earliest)</option>
            <option value="start_date-desc">Start Date (Latest)</option>
            <option value="end_date-asc">End Date (Earliest)</option>
            <option value="end_date-desc">End Date (Latest)</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>
        </div>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Trips</h2>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => {
            setIsAddingTrip(true);
            setNewTrip({ name: '', description: '', image: '' });
          }}
        >
          Add Trip
        </button>
      </div>
      {/* Gallery grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {displayedTrips.map((trip) => (
          <div
            key={trip.id}
            className={`bg-white rounded-xl shadow p-4 flex flex-col items-center border border-gray-100 hover:shadow-lg transition cursor-pointer relative`}
            onClick={() => navigate(`/trips/${trip.id}`)}
          >
            {trip.image ? (
              <img
                src={trip.image}
                alt={trip.name}
                className="w-full h-40 object-cover rounded-lg mb-4 bg-gray-100"
                style={{ background: '#f3f4f6' }}
              />
            ) : (
              <div className="w-full h-40 flex items-center justify-center rounded-lg mb-4 bg-gray-100" style={{ background: '#f3f4f6' }}>
                <Plane size={64} className="text-blue-400" />
              </div>
            )}
            <h3 className="text-lg font-bold mb-1 w-full text-center">{trip.name}</h3>
            {/* Trip Dates */}
            {(trip.start_date || trip.end_date) && (
              <div className="text-xs text-gray-500 mb-1 w-full text-center">
                {formatTripDateRange(trip.start_date, trip.end_date)}
              </div>
            )}
            {/* Trip Summary Row */}
            <div className="text-xs text-gray-600 mb-2 w-full text-center">
              {trip.total_redemptions !== undefined ? `${trip.total_redemptions} Redemptions, ` : ''}
              {trip.total_points !== undefined ? `${trip.total_points.toLocaleString()} Pts, ` : ''}
              {trip.total_value !== undefined ? `${usd(trip.total_value)}` : ''}
            </div>
            <p className="text-gray-600 text-sm mb-2 w-full text-center">{trip.description}</p>
          </div>
        ))}
      </div>

      {/* Add/Edit Trip Modal */}
      {(isAddingTrip || isEditingTrip) && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 min-w-[340px] shadow-2xl relative w-full max-w-md">
            <button
              onClick={() => {
                setIsAddingTrip(false);
                setIsEditingTrip(false);
                setNewTrip({ name: '', description: '', image: '' });
              }}
              className="absolute top-3 right-4 text-2xl text-gray-400 hover:text-gray-600"
            >&times;</button>
            <form onSubmit={isAddingTrip ? handleAddTrip : handleEditTrip}>
              <h2 className="text-xl font-bold mb-4">{isAddingTrip ? 'Add Trip' : 'Edit Trip'}</h2>
              <div className="mb-4">
                <label className="block font-semibold mb-1 text-gray-700">Trip Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={newTrip.name}
                  onChange={e => setNewTrip(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1 text-gray-700">Description</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={newTrip.description}
                  onChange={e => setNewTrip(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1 text-gray-700">Trip Image</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full border border-gray-300 rounded-lg p-2 bg-white shadow-sm"
                  onChange={handleImageChange}
                />
                {newTrip.image && (
                  <img src={newTrip.image} alt="Preview" className="mt-2 w-full h-32 object-cover rounded" />
                )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTrip(false);
                    setIsEditingTrip(false);
                    setNewTrip({ name: '', description: '', image: '' });
                  }}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trips; 