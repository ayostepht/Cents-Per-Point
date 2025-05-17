import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#8ecae6', '#219ebc', '#023047', '#ffb703', '#fb8500'];

const usd = n => n !== '' && n !== null && n !== undefined ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '';

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

  // Prepare data
  const filtered = redemptions.filter(r => {
    if (filters.source && r.source !== filters.source) return false;
    if (filters.dateFrom && r.date < filters.dateFrom) return false;
    if (filters.dateTo && r.date > filters.dateTo) return false;
    return true;
  });

  // Lifetime average CPP
  const cppArr = filtered.map(r => r.points > 0 ? ((r.value - (r.taxes || 0)) / r.points) * 100 : null).filter(x => x !== null && !isNaN(x));
  const avgCpp = cppArr.length ? (cppArr.reduce((a, b) => a + b, 0) / cppArr.length) : null;

  // CPP over time (by date)
  const cppByDate = Object.values(filtered.reduce((acc, r) => {
    if (!acc[r.date]) acc[r.date] = { date: r.date, cppSum: 0, count: 0 };
    const cpp = r.points > 0 ? ((r.value - (r.taxes || 0)) / r.points) * 100 : null;
    if (cpp !== null && !isNaN(cpp)) {
      acc[r.date].cppSum += cpp;
      acc[r.date].count += 1;
    }
    return acc;
  }, {})).map(d => ({ date: d.date, cpp: d.count ? d.cppSum / d.count : null })).sort((a, b) => a.date.localeCompare(b.date));

  // Points spent over time (by date)
  const pointsByDateRaw = Object.values(filtered.reduce((acc, r) => {
    if (!acc[r.date]) acc[r.date] = { date: r.date, points: 0 };
    acc[r.date].points += Number(r.points) || 0;
    return acc;
  }, {})).sort((a, b) => a.date.localeCompare(b.date));

  // Cumulative total points spent over time
  let cumulative = 0;
  const pointsByDate = pointsByDateRaw.map(d => {
    cumulative += d.points;
    return { date: d.date, points: cumulative };
  });

  // Cumulative points by source over time
  const uniqueSources = Array.from(new Set(redemptions.map(r => r.source))).filter(Boolean);
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
  // Merge all source cumulatives into one array for recharts
  const mergedCumulatives = allDates.map(date => {
    const entry = { date };
    uniqueSources.forEach(src => {
      const found = sourceCumulatives[src].find(d => d.date === date);
      entry[src] = found ? found[src] : null;
    });
    return entry;
  });

  // Redemptions by source (for top 3 and avg CPP)
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

  // Top 3 sources by count
  const topSources = [...bySource].sort((a, b) => b.count - a.count).slice(0, 3);

  // Avg CPP by source for bar chart
  const avgCppBySource = bySource.map((s, i) => ({
    source: s.source,
    avgCpp: s.cppCount ? s.cppSum / s.cppCount : null,
    fill: COLORS[i % COLORS.length]
  })).filter(s => s.avgCpp !== null && !isNaN(s.avgCpp));

  // Top 5 redemptions by value
  const topRedemptions = [...filtered].sort((a, b) => b.value - a.value).slice(0, 5);

  return (
    <div>
      <h2>Dashboard</h2>
      <div style={{ marginBottom: 16 }}>
        <label>Source: <select name="source" value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))} style={{ marginRight: 8 }}>
          <option value="">All</option>
          {uniqueSources.map(src => <option key={src} value={src}>{src}</option>)}
        </select></label>
        <label>Date From: <input type="date" name="dateFrom" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} style={{ marginRight: 8 }} /></label>
        <label>Date To: <input type="date" name="dateTo" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} style={{ marginRight: 8 }} /></label>
      </div>
      {loading ? <p>Loading...</p> : (
        <>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, marginBottom: 32 }}>
          {/* Stacked left column */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 260, gap: 8 }}>
            <div style={{ background: '#f6f8fa', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px #eee', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ margin: 0 }}>Lifetime Average CPP</h3>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#219ebc' }}>{avgCpp !== null ? avgCpp.toFixed(1) : '--'}<span style={{ fontSize: 18, color: '#888' }}>&nbsp;cents/pt</span></div>
            </div>
            <div style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 2px 8px #eee', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ margin: '0 0 8px 0' }}>Top 3 Redemption Sources</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 18 }}>
                {topSources.map((s, i) => (
                  <li key={s.source} style={{ marginBottom: 8, fontWeight: 700 }}>
                    <button
                      onClick={() => navigate(`/redemptions?source=${encodeURIComponent(s.source)}`)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: COLORS[i % COLORS.length],
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 18,
                        padding: 0,
                        textDecoration: 'underline',
                      }}
                    >
                      {s.source}
                    </button>
                    <span style={{ color: '#888', fontWeight: 500 }}> ({s.count} redemptions)</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Main chart card */}
          <div style={{ flex: 2, minWidth: 320, background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 2px 8px #eee' }}>
            <h3 style={{ marginBottom: 0 }}>CPP Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={cppByDate} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['auto', 'auto']} tickFormatter={v => v && v.toFixed(1)} />
                <Tooltip formatter={v => v && v.toFixed(1) + '¢/pt'} />
                <Legend />
                <Line type="monotone" dataKey="cpp" stroke="#219ebc" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <h3 style={{ margin: '24px 0 0 0' }}>Cumulative Points Spent Over Time</h3>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={pointsByDate} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#219ebc" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8ecae6" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip formatter={v => v && v.toLocaleString()} />
                <Area type="monotone" dataKey="points" stroke="#219ebc" fillOpacity={1} fill="url(#colorPoints)" />
                {uniqueSources.map((src, i) => (
                  <Line key={src} type="monotone" dataKey={src} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                ))}
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 2px 8px #eee', marginBottom: 32 }}>
          <h3>Average CPP by Source</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={avgCppBySource} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="source" />
              <YAxis domain={['auto', 'auto']} tickFormatter={v => v && v.toFixed(1)} />
              <Tooltip formatter={v => v && v.toFixed(1) + '¢/pt'} />
              <Legend />
              <Bar dataKey="avgCpp" name="Avg CPP (¢/pt)" isAnimationActive fill="#219ebc">
                {avgCppBySource.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 2px 8px #eee', marginBottom: 32 }}>
          <h3>Top 5 Redemptions by Value</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f6f8fa' }}>
                <th>Date</th>
                <th>Source</th>
                <th>Points Used</th>
                <th>Taxes/Fees</th>
                <th>Cash Value</th>
                <th>CPP</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {topRedemptions.map(r => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.source}</td>
                  <td>{r.points}</td>
                  <td>{usd(r.taxes)}</td>
                  <td>{usd(r.value)}</td>
                  <td>{r.points > 0 ? (((r.value - (r.taxes || 0)) / r.points) * 100).toFixed(1) : ''}¢/pt</td>
                  <td>{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ color: '#888', fontSize: 14, textAlign: 'center', marginTop: 24 }}>
          <span>Tip: Use the filters above to explore your redemption patterns by source or date!</span>
        </div>
        </>
      )}
    </div>
  );
} 