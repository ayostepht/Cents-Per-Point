import React, { useState } from 'react';
import axios from 'axios';

function ImportExport() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [columnMappings, setColumnMappings] = useState({});
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setMessage('');
    setAnalysis(null);
    setColumnMappings({});

    // Create FormData and send for analysis
    const formData = new FormData();
    formData.append('csvFile', selectedFile);

    try {
      const response = await axios.post('/api/import-export/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setAnalysis(response.data);
      
      // Initialize mappings with suggested mappings
      if (response.data.suggestedMappings) {
        setColumnMappings(response.data.suggestedMappings);
      }
    } catch (error) {
      setMessage('Error analyzing file: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleMappingChange = (field, value) => {
    setColumnMappings(prev => ({
      ...prev,
      [field]: parseInt(value)
    }));
  };

  const handleImport = async () => {
    if (!file || !analysis) {
      setMessage('Please select a file first');
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('csvFile', file);
    formData.append('columnMappings', JSON.stringify(columnMappings));

    try {
      await axios.post('/api/import-export/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage('File imported successfully!');
      setFile(null);
      setAnalysis(null);
      setColumnMappings({});
    } catch (error) {
      setMessage('Error importing file: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('/api/import-export/export', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'redemptions.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMessage('File exported successfully!');
    } catch (error) {
      setMessage('Error exporting file: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get('/api/import-export/template', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'redemptions-template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setMessage('Error downloading template: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Import/Export Data</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Import Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Data</h2>
          <div className="space-y-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            
            {analysis && (
              <div className="mt-4 space-y-4">
                <h3 className="font-medium text-gray-900">Map CSV Columns</h3>
                <div className="space-y-2">
                  {analysis.fieldDefinitions.required.map(field => (
                    <div key={field.key} className="flex items-center gap-2">
                      <label className="w-32 text-sm text-gray-600">{field.label}:</label>
                      <select
                        value={columnMappings[field.key] ?? ''}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select column...</option>
                        {analysis.headers.map((header, index) => (
                          <option key={index} value={index}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {analysis.fieldDefinitions.optional.map(field => (
                    <div key={field.key} className="flex items-center gap-2">
                      <label className="w-32 text-sm text-gray-600">{field.label}:</label>
                      <select
                        value={columnMappings[field.key] ?? ''}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select column...</option>
                        {analysis.headers.map((header, index) => (
                          <option key={index} value={index}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                >
                  {isImporting ? 'Importing...' : 'Import CSV'}
                </button>
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={handleDownloadTemplate}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Download CSV Template
              </button>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Data</h2>
          <div className="space-y-4">
            <p className="text-gray-600">Download all redemptions data as a CSV file.</p>
            <button
              onClick={handleExport}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mt-6 p-4 rounded-lg ${
          message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {analysis && (
        <div className="mt-8 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">CSV Preview</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {analysis.headers.map((header, index) => (
                    <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analysis.sampleRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-2 text-sm text-gray-500">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Total rows: {analysis.totalRows}
          </p>
        </div>
      )}
    </div>
  );
}

export default ImportExport; 