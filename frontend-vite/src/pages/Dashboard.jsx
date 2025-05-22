import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#8ecae6', '#219ebc', '#023047', '#ffb703', '#fb8500', '#8884d8', '#82ca9d', '#A4DE6C', '#D0ED57', '#FFC658'];

const usd = n => n !== '' && n !== null && n !== undefined ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '';

function MetricCard({ title, value, icon }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex items-center gap-4">
      <div className="p-4 bg-gray-100 rounded-full text-2xl flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
        <p className="text-3xl font-extrabold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ source: '', dateFrom: '', dateTo: '' });
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/redemptions')
      .then(res => {
        setRedemptions(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Data prep
  const filtered = useMemo(() => redemptions.filter(r => {
    if (filters.source && r.source !== filters.source) return false;
    if (filters.dateFrom && r.date < filters.dateFrom) return false;
    if (filters.dateTo && r.date > filters.dateTo) return false;
    return true;
  }), [redemptions, filters]);

  const cppArr = filtered.map(r => r.points > 0 ? ((r.value - (r.taxes || 0)) / r.points) * 100 : null).filter(x => x !== null && !isNaN(x));
  const avgCpp = cppArr.length ? (cppArr.reduce((a, b) => a + b, 0) / cppArr.length) : null;
  const totalValue = filtered.reduce((sum, r) => sum + (parseFloat(r.value) - parseFloat(r.taxes || 0)), 0);
  const totalPoints = filtered.reduce((sum, r) => sum + parseFloat(r.points), 0);

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

  const cppByDate = useMemo(() => Object.values(filtered.reduce((acc, r) => {
    if (!acc[r.date]) acc[r.date] = { date: r.date, cppSum: 0, count: 0 };
    const cpp = r.points > 0 ? ((r.value - (r.taxes || 0)) / r.points) * 100 : null;
    if (cpp !== null && !isNaN(cpp)) {
      acc[r.date].cppSum += cpp;
      acc[r.date].count += 1;
    }
    return acc;
  }, {})).map(d => ({ date: d.date, cpp: d.count ? d.cppSum / d.count : null })).sort((a, b) => a.date.localeCompare(b.date)), [filtered]);

  const pointsByDateRaw = useMemo(() => Object.values(filtered.reduce((acc, r) => {
    if (!acc[r.date]) acc[r.date] = { date: r.date, points: 0 };
    acc[r.date].points += Number(r.points) || 0;
    return acc;
  }, {})).sort((a, b) => a.date.localeCompare(b.date)), [filtered]);

  let cumulative = 0;
  const pointsByDate = pointsByDateRaw.map(d => {
    cumulative += d.points;
    return { date: d.date, points: cumulative };
  });

  const uniqueSources = Array.from(new Set(filtered.map(r => r.source))).filter(Boolean);
  const allDates = Array.from(new Set(filtered.map(r => r.date))).sort();
  const sourceCumulatives = {};
  uniqueSources.forEach((src, i) => {
    let cum = 0;
    sourceCumulatives[src] = allDates.map(date => {
      const pts = filtered.filter(r => r.source === src && r.date === date).reduce((sum, r) => sum + (Number(r.points) || 0), 0);
      cum += pts;
      return { date, [src]: cum };
    });
  });
  const mergedCumulatives = allDates.map(date => {
    const entry = { date };
    uniqueSources.forEach(src => {
      const found = sourceCumulatives[src].find(d => d.date === date);
      entry[src] = found ? found[src] : null;
    });
    return entry;
  });

  const bySource = Object.values(filtered.reduce((acc, r) => {
    if (!acc[r.source]) acc[r.source] = { source: r.source, count: 0, cppSum: 0, cppCount: 0 };
    acc[r.source].count += 1;
    const cpp = r.points > 0 ? ((r.value - (r.taxes || 0)) / r.points) * 100 : null;
    if (cpp !== null && !isNaN(cpp)) {
      acc[r.source].cppSum += cpp;
      acc[r.source].cppCount += 1;
    }
    return acc;
  }, {}));

  const topSources = [...bySource].sort((a, b) => b.count - a.count).slice(0, 3);

  const avgCppBySource = bySource.map((s, i) => ({
    source: s.source,
    avgCpp: s.cppCount ? s.cppSum / s.cppCount : null,
    fill: COLORS[i % COLORS.length]
  })).filter(s => s.avgCpp !== null && !isNaN(s.avgCpp));

  const topRedemptions = [...filtered].sort((a, b) => b.value - a.value).slice(0, 5);

  // Best and worst redemptions
  const bestRedemption = filtered.length ? filtered.reduce((a, b) => (a.points > 0 && ((a.value - (a.taxes || 0)) / a.points) > ((b.value - (b.taxes || 0)) / b.points) ? a : b)) : null;
  const worstRedemption = filtered.length ? filtered.reduce((a, b) => (a.points > 0 && ((a.value - (a.taxes || 0)) / a.points) < ((b.value - (b.taxes || 0)) / b.points) ? a : b)) : null;

  const recentRedemptions = filtered.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10 bg-gray-50 min-h-screen">
      <h2 className="text-5xl font-extrabold text-gray-900 mb-8 tracking-tight">Dashboard</h2>
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Overall Average CPP" value={avgCpp !== null ? avgCpp.toFixed(2) + ' ¢' : '--'} icon={<span className="text-blue-500"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg></span>} />
        <MetricCard title="Total Value Redeemed" value={usd(totalValue)} icon={<span className="text-green-500">$</span>} />
        <MetricCard title="Total Points Redeemed" value={totalPoints.toLocaleString()} icon={<span className="text-purple-500"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg></span>} />
        <MetricCard title="Total Redemptions" value={filtered.length.toLocaleString()} icon={<span className="text-indigo-500"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span>} />
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-platinum-400">
          <h3 className="text-lg font-bold text-oxford-blue-400 mb-3">Avg CPP by Source</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cppBySourceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-30} textAnchor="end" height={70} interval={0} tick={{fontSize: 10}} />
              <YAxis label={{ value: 'CPP (¢)', angle: -90, position: 'insideLeft', offset:10, fontSize: 12 }} tick={{fontSize: 10}} />
              <Tooltip />
              <Legend wrapperStyle={{fontSize: "12px"}} />
              <Bar dataKey="CPP" fill="#8884d8">
                {cppBySourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border border-platinum-400">
          <h3 className="text-lg font-bold text-oxford-blue-400 mb-3">CPP Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cppByDate} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-30} textAnchor="end" height={70} interval={0} tick={{fontSize: 10}} />
              <YAxis label={{ value: 'CPP (¢)', angle: -90, position: 'insideLeft', offset:10, fontSize: 12 }} tick={{fontSize: 10}} />
              <Tooltip />
              <Legend wrapperStyle={{fontSize: "12px"}} />
              <Line type="monotone" dataKey="cpp" stroke="#219ebc" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-platinum-400">
          <h3 className="text-lg font-bold text-oxford-blue-400 mb-3">Points by Source</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={cppBySourceData.map(s => ({name: s.name, value: filtered.filter(r => r.source === s.name).reduce((sum, r) => sum + r.points, 0)}))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {cppBySourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{fontSize: "12px"}} iconSize={10}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border border-platinum-400">
          <h3 className="text-lg font-bold text-oxford-blue-400 mb-3">Cumulative Points Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={pointsByDate} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#219ebc" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8ecae6" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" angle={-30} textAnchor="end" height={70} interval={0} tick={{fontSize: 10}} />
              <YAxis tick={{fontSize: 10}} />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Area type="monotone" dataKey="points" stroke="#219ebc" fillOpacity={1} fill="url(#colorPoints)" />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Best/Worst & Recent Redemptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-platinum-400">
          <h3 className="text-lg font-bold text-oxford-blue-400 mb-3">🌟 Best Redemption (by CPP)</h3>
          {bestRedemption ? (
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Date:</span> {new Date(bestRedemption.date).toLocaleDateString()}</p>
              <p><span className="font-medium">Source:</span> {bestRedemption.source}</p>
              <p><span className="font-medium">Points:</span> {bestRedemption.points.toLocaleString()}</p>
              <p><span className="font-medium">Value:</span> {usd(bestRedemption.value - (bestRedemption.taxes || 0))}</p>
              <p className="text-indigo-600 font-semibold"><span className="font-medium">CPP:</span> {(((bestRedemption.value - (bestRedemption.taxes || 0)) / bestRedemption.points) * 100).toFixed(2)} ¢</p>
            </div>
          ) : <p className="text-sm text-gray-500">N/A</p>}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border border-platinum-400">
          <h3 className="text-lg font-bold text-oxford-blue-400 mb-3">📉 Worst Redemption (by CPP)</h3>
          {worstRedemption ? (
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Date:</span> {new Date(worstRedemption.date).toLocaleDateString()}</p>
              <p><span className="font-medium">Source:</span> {worstRedemption.source}</p>
              <p><span className="font-medium">Points:</span> {worstRedemption.points.toLocaleString()}</p>
              <p><span className="font-medium">Value:</span> {usd(worstRedemption.value - (worstRedemption.taxes || 0))}</p>
              <p className="text-red-600 font-semibold"><span className="font-medium">CPP:</span> {(((worstRedemption.value - (worstRedemption.taxes || 0)) / worstRedemption.points) * 100).toFixed(2)} ¢</p>
            </div>
          ) : <p className="text-sm text-gray-500">N/A</p>}
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-md border border-platinum-400">
        <h3 className="text-xl font-bold text-oxford-blue-500 mb-4">Recent Redemptions</h3>
        {recentRedemptions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPP (¢)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentRedemptions.map(r => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{r.source}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{r.points > 0 ? (((r.value - (r.taxes || 0)) / r.points) * 100).toFixed(2) : '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-gray-500">No recent redemptions.</p>}
      </div>
    </div>
  );
} 