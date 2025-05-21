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
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-2">Should I Book It?</h2>
      <p className="mb-4 text-gray-600">Calculate the cents-per-point (CPP) value for a potential booking.</p>
      <form onSubmit={e => e.preventDefault()}>
        <div className="mb-4">
          <label className="block font-medium mb-1">Point Type<br />
            <select value={program} onChange={e => setProgram(e.target.value)} className="w-full border border-gray-300 rounded p-2" required>
              <option value="">Select Program</option>
              {pointPrograms.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Points Needed<br />
            <input type="number" min="1" value={points} onChange={e => setPoints(e.target.value)} className="w-full border border-gray-300 rounded p-2" />
          </label>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Total Cash Value ($)<br />
            <input type="number" min="0.01" step="0.01" value={cashValue} onChange={e => setCashValue(e.target.value)} className="w-full border border-gray-300 rounded p-2" />
          </label>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Taxes/Fees ($, optional)<br />
            <input type="number" min="0" step="0.01" value={taxes} onChange={e => setTaxes(e.target.value)} className="w-full border border-gray-300 rounded p-2" />
          </label>
        </div>
      </form>
      <div className="mt-6 text-xl font-bold">
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