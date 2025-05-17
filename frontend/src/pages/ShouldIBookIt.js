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
    <div style={{ maxWidth: 400, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #8ecae644', padding: 32 }}>
      <h2>Should I Book It?</h2>
      <p>Calculate the cents-per-point (CPP) value for a potential booking.</p>
      <form onSubmit={e => e.preventDefault()}>
        <div style={{ marginBottom: 16 }}>
          <label>Point Type<br />
            <select value={program} onChange={e => setProgram(e.target.value)} style={{ width: '100%' }} required>
              <option value="">Select Program</option>
              {pointPrograms.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Points Needed<br />
            <input type="number" min="1" value={points} onChange={e => setPoints(e.target.value)} style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Total Cash Value ($)<br />
            <input type="number" min="0.01" step="0.01" value={cashValue} onChange={e => setCashValue(e.target.value)} style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Taxes/Fees ($, optional)<br />
            <input type="number" min="0" step="0.01" value={taxes} onChange={e => setTaxes(e.target.value)} style={{ width: '100%' }} />
          </label>
        </div>
      </form>
      <div style={{ marginTop: 24, fontSize: 20, fontWeight: 700 }}>
        {isValid ? (
          <>
            CPP: <span style={{ color: '#219ebc' }}>{cpp}¢/pt</span>
            <div style={{ marginTop: 8, fontSize: 16, fontWeight: 500, color: opinion === 'Great use of points!' ? 'green' : opinion === 'Potentially worth it.' ? '#ffb703' : 'red' }}>
              {opinion}
              {refValue && (
                <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
                  {pointPrograms.find(p => p.value === program).label} is commonly valued around {(refValue * 100).toFixed(1)}¢/pt
                </div>
              )}
            </div>
          </>
        ) : (
          <span style={{ color: '#888' }}>Enter all fields to calculate CPP and get an opinion.</span>
        )}
      </div>
    </div>
  );
} 