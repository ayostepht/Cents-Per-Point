import React, { useState } from 'react';

const pointPrograms = [
  { label: 'Chase', value: 'chase', ref: 0.02 },
  { label: 'Amex', value: 'amex', ref: 0.02 },
  { label: 'Capital One', value: 'capitalone', ref: 0.018 },
  { label: 'Bilt', value: 'bilt', ref: 0.015 },
  { label: 'Citi', value: 'citi', ref: 0.018 },
  { label: 'World of Hyatt', value: 'hyatt', ref: 0.023 },
  { label: 'Marriott Bonvoy', value: 'marriott', ref: 0.007 },
  { label: 'Hilton Honors', value: 'hilton', ref: 0.006 },
  { label: 'IHG One Rewards', value: 'ihg', ref: 0.009 },
  { label: 'Delta SkyMiles', value: 'delta', ref: 0.011 },
  { label: 'Southwest Rapid Rewards', value: 'southwest', ref: 0.015 },
  { label: 'United MileagePlus', value: 'united', ref: 0.012 },
  { label: 'Alaska Airlines', value: 'alaska', ref: 0.014 },
  { label: 'Hawaiian Airlines', value: 'hawaiian', ref: 0.009 },
];

export default function ShouldIBookIt() {
  const [points, setPoints] = useState('');
  const [cashValue, setCashValue] = useState('');
  const [taxes, setTaxes] = useState('');
  const [program, setProgram] = useState('');

  const isValid = points > 0 && cashValue > 0 && program;
  const cpp = isValid ? (((Number(cashValue) - Number(taxes || 0)) / Number(points)) * 100).toFixed(2) : '';
  const refValue = program ? pointPrograms.find(p => p.value === program).ref : null;

  let opinion = '';
  if (isValid && refValue) {
    const cppDollars = Number(cpp) / 100;
    if (cppDollars >= refValue) {
      opinion = 'Great use of points!';
    } else if (cppDollars >= refValue * 0.9) {
      opinion = 'Potentially worth it.';
    } else {
      opinion = 'Consider booking with cash.';
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-10 mt-10">
      <h2 className="text-4xl font-extrabold mb-2 text-gray-900 text-center">Cents Per Point Calculator</h2>
      <p className="mb-6 text-gray-500 text-center text-lg">Determine if a potential redemption is a good use of your points. Enter the details below to calculate the Cents Per Point (CPP) value.</p>
      <form onSubmit={e => e.preventDefault()} className="space-y-5">
        <div>
          <label className="block font-semibold mb-1 text-gray-700">Source Program<br />
            <select value={program} onChange={e => setProgram(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" required>
              <option value="">Select Program</option>
              {pointPrograms.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
          {program && <div className="text-xs text-gray-400 mt-1">Commonly accepted value for {pointPrograms.find(p => p.value === program).label}: ~{(pointPrograms.find(p => p.value === program).ref * 100).toFixed(1)}¢/pt</div>}
        </div>
        <div>
          <label className="block font-semibold mb-1 text-gray-700">Total Points Required<br />
            <input type="number" min="1" value={points} onChange={e => setPoints(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="e.g., 50000" />
          </label>
        </div>
        <div>
          <label className="block font-semibold mb-1 text-gray-700">Taxes/Fees (USD)<br />
            <input type="number" min="0" step="0.01" value={taxes} onChange={e => setTaxes(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="0" />
          </label>
        </div>
        <div>
          <label className="block font-semibold mb-1 text-gray-700">Cash Value of Redemption (USD)<br />
            <input type="number" min="0.01" step="0.01" value={cashValue} onChange={e => setCashValue(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="e.g., 1000" />
          </label>
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow text-lg flex items-center justify-center gap-2"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M12 8v8"/></svg> Calculate CPP</button>
      </form>
      <div className="mt-8 text-xl font-bold text-center">
        {isValid ? (
          <>
            CPP: <span className="text-blue-600">{cpp}¢/pt</span>
            <div className={
              "mt-2 text-base font-medium " +
              (opinion === 'Great use of points!' ? 'text-green-600' : opinion === 'Potentially worth it.' ? 'text-yellow-600' : 'text-red-600')
            }>
              {opinion}
              {refValue && (
                <div className="text-xs text-gray-500 mt-1">
                  {pointPrograms.find(p => p.value === program).label} is commonly valued around {(refValue * 100).toFixed(1)}¢/pt
                </div>
              )}
            </div>
          </>
        ) : (
          <span className="text-gray-400">Enter all fields to calculate CPP and get an opinion.</span>
        )}
      </div>
    </div>
  );
} 