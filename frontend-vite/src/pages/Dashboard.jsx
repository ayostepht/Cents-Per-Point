import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';
import API_URL from '../config';
import { MultiSelect } from 'react-multi-select-component';
import { Plane } from 'lucide-react';

const COLORS = ['#8ecae6', '#219ebc', '#023047', '#ffb703', '#fb8500', '#8884d8', '#82ca9d', '#A4DE6C', '#D0ED57', '#FFC658'];

const usd = n => n !== '' && n !== null && n !== undefined ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '';

// Helper function to format large numbers more compactly for small screens
const formatCompactNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
};

// Helper function to format currency compactly for small screens
const formatCompactCurrency = (num) => {
  if (num >= 1000000) {
    return '$' + (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return '$' + (num / 1000).toFixed(1) + 'K';
  }
  return usd(num);
};

// Helper function to format numbers for medium screens (less aggressive than mobile)
const formatMediumNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 100000) {
    return (num / 1000).toFixed(0) + 'K';
  }
  return num.toLocaleString();
};

// Helper function to format currency for medium screens
const formatMediumCurrency = (num) => {
  if (num >= 1000000) {
    return '$' + (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 10000) {
    return '$' + (num / 1000).toFixed(0) + 'K';
  }
  return usd(num);
};

// Custom date formatter for cleaner x-axis labels
const formatDateForChart = (dateStr) => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
};

// Custom tick formatter for x-axis that shows fewer labels
const formatDateTick = (tickItem, index, ticks) => {
  // Only show every nth label based on total count to prevent crowding
  const totalTicks = ticks.length;
  let interval = 1;
  if (totalTicks > 10) interval = Math.ceil(totalTicks / 8);
  if (totalTicks > 20) interval = Math.ceil(totalTicks / 6);
  if (totalTicks > 30) interval = Math.ceil(totalTicks / 5);
  
  if (index % interval === 0) {
    return formatDateForChart(tickItem);
  }
  return '';
};

// Custom tooltip for pie chart with Type, %, Amount
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const { name, value, payload: pieData } = data;
    
    // Calculate total from all pie data
    const total = pieData.data?.reduce((sum, item) => sum + item.value, 0) || 0;
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
    
    return (
      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #ccc', 
        borderRadius: '8px',
        padding: '12px',
        textAlign: 'left',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div><strong>Type:</strong> {name}</div>
        <div><strong>Amount:</strong> {value.toLocaleString()} points</div>
        <div><strong>Percentage:</strong> {percentage}%</div>
      </div>
    );
  }
  return null;
};

function MetricCard({ title, value, icon }) {
  return (
    <div className="bg-white p-2 sm:p-3 md:p-1.5 lg:p-2 xl:p-2.5 rounded-xl shadow border border-gray-100 flex flex-col justify-between min-w-0 relative" style={{minHeight: 80}}>
      <div className="absolute top-2 right-2 text-base sm:text-lg md:text-base lg:text-base xl:text-lg flex items-center justify-center flex-shrink-0 opacity-80">
        {icon}
      </div>
      <div className="min-w-0 flex-1 flex flex-col items-center justify-center">
        <p className="text-xs sm:text-sm md:text-xs lg:text-xs xl:text-sm text-gray-500 font-medium mb-1 leading-tight pr-6 w-full text-left" title={title}>
          <span className="block truncate">{title}</span>
        </p>
        <p className="text-lg sm:text-xl md:text-2xl font-extrabold text-gray-900 break-words leading-tight text-center">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [redemptions, setRedemptions] = useState([]);
  const [filters, setFilters] = useState({ source: [], dateFrom: '', dateTo: '', trip: [] });
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/api/redemptions`),
      axios.get(`${API_URL}/api/trips`)
    ]).then(([redemptionsRes, tripsRes]) => {
      setRedemptions(redemptionsRes.data);
      setTrips(tripsRes.data);
    }).catch(() => {/* setLoading(false); */});
  }, []);

  // Data prep
  const filtered = useMemo(() => redemptions.filter(r => {
    if (filters.source.length > 0 && !filters.source.includes(r.source)) return false;
    if (filters.dateFrom && r.date < filters.dateFrom) return false;
    if (filters.dateTo && r.date > filters.dateTo) return false;
    if (filters.trip.length > 0 && !filters.trip.includes(r.trip_id)) return false;
    return true;
  }), [redemptions, filters]);

  // Calculate average CPP as (sum(value - taxes) / sum(points)) * 100
  const totalValueMinusTaxes = filtered.reduce((sum, r) => sum + (Number(r.value) - Number(r.taxes || 0)), 0);
  const totalPoints = filtered.reduce((sum, r) => sum + Number(r.points), 0);
  const avgCpp = totalPoints > 0 ? (totalValueMinusTaxes / totalPoints) * 100 : null;
  const totalValue = filtered.reduce((sum, r) => sum + (parseFloat(r.value) - parseFloat(r.taxes || 0)), 0);

  const cppBySourceData = useMemo(() => {
    if (!filtered.length) return [];
    const sourceMap = new Map();
    filtered.forEach(r => {
      if (!sourceMap.has(r.source)) {
        sourceMap.set(r.source, { totalCpp: 0, count: 0, name: r.source });
      }
      const current = sourceMap.get(r.source);
      current.totalCpp += r.points > 0 ? ((r.value - (r.taxes || 0)) / r.points) * 100 : 0;
      current.count += 1;
      sourceMap.set(r.source, current);
    });
    return Array.from(sourceMap.values()).map(s => ({ name: s.name, CPP: parseFloat((s.totalCpp / s.count).toFixed(2)) }));
  }, [filtered]);

  // Improved CPP by date calculation for continuous line
  const cppByDate = useMemo(() => {
    const dateMap = new Map();
    
    // Group redemptions by date and calculate daily CPP
    filtered.forEach(r => {
      const date = r.date;
      if (!dateMap.has(date)) {
        dateMap.set(date, { date, cppSum: 0, count: 0, totalValue: 0, totalPoints: 0 });
      }
      
      const dayData = dateMap.get(date);
      if (r.points > 0) {
        const cpp = ((r.value - (r.taxes || 0)) / r.points) * 100;
        if (!isNaN(cpp)) {
          dayData.cppSum += cpp;
          dayData.count += 1;
          dayData.totalValue += (r.value - (r.taxes || 0));
          dayData.totalPoints += r.points;
        }
      }
      dateMap.set(date, dayData);
    });

    // Convert to array and sort by date
    const result = Array.from(dateMap.values())
      .filter(d => d.count > 0)
      .map(d => ({
        date: d.date,
        cpp: parseFloat((d.cppSum / d.count).toFixed(2)),
        formattedDate: formatDateForChart(d.date)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }, [filtered]);

  const pointsByDateRaw = useMemo(() => Object.values(filtered.reduce((acc, r) => {
    if (!acc[r.date]) acc[r.date] = { date: r.date, points: 0 };
    acc[r.date].points += Number(r.points) || 0;
    return acc;
  }, {})).sort((a, b) => a.date.localeCompare(b.date)), [filtered]);

  let cumulative = 0;
  const pointsByDate = pointsByDateRaw.map(d => {
    cumulative += d.points;
    return { 
      date: d.date, 
      points: cumulative,
      formattedDate: formatDateForChart(d.date)
    };
  });

  const uniqueSources = Array.from(new Set(filtered.map(r => r.source))).filter(Boolean);
  const allDates = Array.from(new Set(filtered.map(r => r.date))).sort();
  const sourceCumulatives = {};
  uniqueSources.forEach((src) => {
    let cum = 0;
    sourceCumulatives[src] = allDates.map(date => {
      const pts = filtered.filter(r => r.source === src && r.date === date).reduce((sum, r) => sum + (Number(r.points) || 0), 0);
      cum += pts;
      return { date, [src]: cum };
    });
  });

  const validRedemptions = filtered.filter(r => r.points > 0);
  const sortedByCpp = validRedemptions.sort((a, b) => {
    const aCpp = ((a.value - (a.taxes || 0)) / a.points);
    const bCpp = ((b.value - (b.taxes || 0)) / b.points);
    return bCpp - aCpp; // Descending order
  });
  const bestRedemption = sortedByCpp.length > 0 ? sortedByCpp[0] : null;
  const worstRedemption = sortedByCpp.length > 0 ? sortedByCpp[sortedByCpp.length - 1] : null;

  const recentRedemptions = filtered.slice(0, 5);

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">Dashboard</h2>
        {/* Filter Card (compact) */}
        <div className="bg-gray-50 rounded-xl shadow-sm p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Trip Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Trip</label>
              <MultiSelect
                options={trips.map(trip => ({ label: trip.name, value: trip.id }))}
                value={filters.trip.map(id => ({ label: trips.find(t => t.id === id)?.name, value: id })).filter(Boolean)}
                onChange={selected => setFilters(f => ({ ...f, trip: selected.map(opt => opt.value) }))}
                labelledBy="Select Trip"
                className="min-w-[120px]"
                hasSelectAll={false}
                overrideStrings={{ selectSomeItems: 'Select Trip(s)', allItemsAreSelected: 'All Trips', search: 'Search...' }}
              />
            </div>
            {/* Source Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Source</label>
              <MultiSelect
                options={Array.from(new Set(redemptions.map(r => r.source))).filter(Boolean).map(source => ({ label: source, value: source }))}
                value={filters.source.map(source => ({ label: source, value: source }))}
                onChange={selected => setFilters(f => ({ ...f, source: selected.map(opt => opt.value) }))}
                labelledBy="Select Source"
                className="min-w-[120px]"
                hasSelectAll={false}
                overrideStrings={{ selectSomeItems: 'Select Source(s)', allItemsAreSelected: 'All Sources', search: 'Search...' }}
              />
            </div>
            {/* Date From Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
              />
            </div>
            {/* Date To Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
              />
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => setFilters({ source: [], dateFrom: '', dateTo: '', trip: [] })}
              className="px-3 py-1 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
        {/* Summary Statistics Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-8 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            <MetricCard title="Overall Average CPP" value={avgCpp !== null ? avgCpp.toFixed(2) + ' ¢' : '--'} icon={<span className="text-blue-500"><svg width="18" height="18" className="xl:w-5 xl:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg></span>} />
            <MetricCard title="Total Value Redeemed" value={<><span className="hidden lg:inline">{usd(totalValue)}</span><span className="hidden sm:inline lg:hidden">{formatMediumCurrency(totalValue)}</span><span className="sm:hidden">{formatCompactCurrency(totalValue)}</span></>} icon={<span className="text-green-500">$</span>} />
            <MetricCard title="Total Points Redeemed" value={<><span className="hidden lg:inline">{totalPoints.toLocaleString()}</span><span className="hidden sm:inline lg:hidden">{formatMediumNumber(totalPoints)}</span><span className="sm:hidden">{formatCompactNumber(totalPoints)}</span></>} icon={<span className="text-purple-500"><svg width="18" height="18" className="xl:w-5 xl:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg></span>} />
            <MetricCard title="Total Redemptions" value={filtered.length} icon={<span className="text-orange-500"><svg width="18" height="18" className="xl:w-5 xl:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg></span>} />
            <MetricCard title="Total Trips" value={trips.length} icon={<span className="text-cyan-500"><Plane size={18} className="xl:w-5 xl:h-5" /></span>} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Avg CPP by Source</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cppBySourceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-30} textAnchor="end" height={70} interval={0} tick={{fontSize: 10}} />
                <YAxis label={{ value: 'CPP (¢)', angle: -90, position: 'insideLeft', offset:10, fontSize: 12 }} tick={{fontSize: 10}} />
                <Tooltip />
                <Bar dataKey="CPP" fill="#8884d8">
                  {cppBySourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">CPP Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cppByDate} margin={{ top: 5, right: 20, left: 10, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="formattedDate"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{fontSize: 10}}
                  tickFormatter={(value, index) => formatDateTick(cppByDate[index]?.date || value, index, cppByDate)}
                />
                <YAxis label={{ value: 'CPP (¢)', angle: -90, position: 'insideLeft', offset:10, fontSize: 12 }} tick={{fontSize: 10}} />
                <Tooltip 
                  labelFormatter={(value) => `Date: ${value}`}
                  formatter={(value) => [`${value}¢`, 'CPP']}
                />
                <Line 
                  type="monotone" 
                  dataKey="cpp" 
                  stroke="#219ebc" 
                  strokeWidth={3} 
                  dot={{ fill: '#219ebc', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#219ebc', strokeWidth: 2 }}
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Points by Source</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cppBySourceData.map(s => ({
                    name: s.name,
                    value: filtered.filter(r => r.source === s.name).reduce((sum, r) => sum + r.points, 0),
                    data: cppBySourceData.map(s => ({
                      name: s.name,
                      value: filtered.filter(r => r.source === s.name).reduce((sum, r) => sum + r.points, 0)
                    }))
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {cppBySourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend 
                  wrapperStyle={{fontSize: "11px"}} 
                  iconSize={8}
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Cumulative Points Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={pointsByDate} margin={{ top: 8, right: 16, left: 0, bottom: 50 }}>
                <defs>
                  <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#219ebc" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8ecae6" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="formattedDate"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{fontSize: 10}}
                  tickFormatter={(value, index) => formatDateTick(pointsByDate[index]?.date || value, index, pointsByDate)}
                />
                <YAxis tick={{fontSize: 10}} />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip 
                  labelFormatter={(value) => `Date: ${value}`}
                  formatter={(value) => [value.toLocaleString() + ' points', 'Cumulative Points']}
                />
                <Area type="monotone" dataKey="points" stroke="#219ebc" fillOpacity={1} fill="url(#colorPoints)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🌟 Best Redemption (by CPP)</h3>
            {bestRedemption ? (
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Date:</span> {new Date(bestRedemption.date).toLocaleDateString()}</p>
                <p><span className="font-medium">Source:</span> {bestRedemption.source}</p>
                <p><span className="font-medium">Points:</span> {bestRedemption.points.toLocaleString()}</p>
                <p><span className="font-medium">Value:</span> {usd(bestRedemption.value - (bestRedemption.taxes || 0))}</p>
                <p className="text-green-600 font-semibold"><span className="font-medium">CPP:</span> {(((bestRedemption.value - (bestRedemption.taxes || 0)) / bestRedemption.points) * 100).toFixed(2)} ¢</p>
              </div>
            ) : <p className="text-sm text-gray-500">N/A</p>}
          </div>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📉 Worst Redemption (by CPP)</h3>
            {worstRedemption ? (
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Date:</span> {new Date(worstRedemption.date).toLocaleDateString()}</p>
                <p><span className="font-medium">Source:</span> {worstRedemption.source}</p>
                <p><span className="font-medium">Points:</span> {worstRedemption.points.toLocaleString()}</p>
                <p><span className="font-medium">Value:</span> {usd(worstRedemption.value - (worstRedemption.taxes || 0))}</p>
                <p className="text-red-600 font-semibold"><span className="font-medium">CPP:</span> {(((worstRedemption.value - (worstRedemption.taxes || 0)) / worstRedemption.points) * 100).toFixed(2)} ¢</p>
              </div>
            ) : <p className="text-sm text-gray-500">N/A</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Recent Redemptions</h3>
          {recentRedemptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPP (¢)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentRedemptions.map(r => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{r.source}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{r.points > 0 ? (((r.value - (r.taxes || 0)) / r.points) * 100).toFixed(2) : '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-gray-500">No recent redemptions.</p>}
        </div>
      </div>
    </div>
  );
} 