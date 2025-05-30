import React, { useState } from 'react';
import { pointPrograms } from '../constants/sourceOptions';

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
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-3xl font-bold mb-3 text-gray-900">Cents Per Point Calculator</h2>
          <p className="mb-6 text-gray-600">Calculate CPP value to determine if a redemption is worthwhile.</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Section */}
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1 text-gray-700 text-sm">Source Program</label>
                <select value={program} onChange={e => setProgram(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-sm" required>
                  <option value="">Select Program</option>
                  
                  <optgroup label="Credit Cards">
                    {pointPrograms.filter(p => ['chase', 'amex', 'capitalone', 'citi', 'bilt', 'wellsfargo', 'boa', 'discover', 'usbank', 'barclays'].includes(p.value)).map(p => (
                      <option key={p.value} value={p.value}>{p.label} (~{(p.ref * 100).toFixed(1)}¢/pt)</option>
                    ))}
                  </optgroup>
                  
                  <optgroup label="Airlines">
                    {pointPrograms.filter(p => ['southwest', 'britishairways', 'singapore', 'alaska', 'jetblue', 'flyingblue', 'virgin', 'american', 'united', 'aircanada', 'qatar', 'delta', 'lufthansa', 'emirates', 'hawaiian', 'spirit', 'frontier'].includes(p.value)).map(p => (
                      <option key={p.value} value={p.value}>{p.label} (~{(p.ref * 100).toFixed(1)}¢/pt)</option>
                    ))}
                  </optgroup>
                  
                  <optgroup label="Hotels">
                    {pointPrograms.filter(p => ['hyatt', 'wyndham', 'ihg', 'choice', 'bestwestern', 'accor', 'radisson', 'sonesta', 'marriott', 'hilton'].includes(p.value)).map(p => (
                      <option key={p.value} value={p.value}>{p.label} (~{(p.ref * 100).toFixed(1)}¢/pt)</option>
                    ))}
                  </optgroup>
                </select>
                {program && (
                  <div className="text-xs text-gray-500 mt-1 p-2 bg-blue-50 rounded">
                    Typical value: ~{(pointPrograms.find(p => p.value === program).ref * 100).toFixed(1)}¢/pt
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-gray-700 text-sm">Points Required</label>
                  <input type="number" min="1" value={points} onChange={e => setPoints(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-sm" placeholder="50000" />
                </div>
                
                <div>
                  <label className="block font-medium mb-1 text-gray-700 text-sm">Cash Value ($)</label>
                  <input type="number" min="0.01" step="0.01" value={cashValue} onChange={e => setCashValue(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-sm" placeholder="1000" />
                </div>
              </div>
              
              <div>
                <label className="block font-medium mb-1 text-gray-700 text-sm">Taxes/Fees ($)</label>
                <input type="number" min="0" step="0.01" value={taxes} onChange={e => setTaxes(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-sm" placeholder="0" />
              </div>
            </div>

            {/* Results Section */}
            <div className="flex flex-col justify-center">
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                {isValid ? (
                  <>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      CPP: <span className="text-blue-600">{cpp}¢/pt</span>
                    </div>
                    <div className={
                      "text-lg font-semibold mb-2 " +
                      (opinion === 'Great use of points!' ? 'text-green-600' : opinion === 'Potentially worth it.' ? 'text-yellow-600' : 'text-red-600')
                    }>
                      {opinion}
                    </div>
                    {refValue && (
                      <div className="text-xs text-gray-500">
                        Benchmark: {(refValue * 100).toFixed(1)}¢/pt
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-lg text-gray-400">
                    Enter details to calculate CPP
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 