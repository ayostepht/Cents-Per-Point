import React, { useState } from 'react';
import axios from 'axios';
import API_URL from '../config';
import { Upload, FileText, CheckCircle, AlertCircle, Download, ArrowRight } from 'lucide-react';

function ImportExport() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [columnMappings, setColumnMappings] = useState({});
  const [isImporting, setIsImporting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setMessage('');
    setAnalysis(null);
    setColumnMappings({});
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);

      const response = await axios.post(`${API_URL}/api/import-export/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setAnalysis(response.data);
      
      // Auto-apply suggested mappings
      if (response.data.suggestedMappings) {
        setColumnMappings(response.data.suggestedMappings);
      }
    } catch (error) {
      console.error('Error analyzing file:', error);
      setMessage('Error analyzing file: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMappingChange = (field, value) => {
    setColumnMappings(prev => ({
      ...prev,
      [field]: value === '' ? undefined : parseInt(value)
    }));
  };

  // Validation for mappings
  const validateMappings = () => {
    if (!analysis) return { isValid: false, errors: [] };
    
    const errors = [];
    const requiredFields = analysis.fieldDefinitions.required;
    
    requiredFields.forEach(field => {
      if (columnMappings[field.key] === undefined || columnMappings[field.key] === '') {
        errors.push(`${field.label} is required`);
      }
    });
    
    return { isValid: errors.length === 0, errors };
  };

  const { isValid: isMappingValid, errors: mappingErrors } = validateMappings();

  const handleImport = async () => {
    if (!file || !analysis || !isMappingValid) {
      setMessage('Please complete all required field mappings before importing.');
      return;
    }

    setIsImporting(true);
    setMessage('');
    const formData = new FormData();
    formData.append('csvFile', file);
    formData.append('columnMappings', JSON.stringify(columnMappings));

    try {
      const response = await axios.post(`${API_URL}/api/import-export/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const data = response.data;
      let successMessage = data.message;
      
      if (data.warnings && data.warnings.length > 0) {
        successMessage += '\n\nWarnings handled automatically:\n' + data.warnings.join('\n');
      }
      
      setMessage(successMessage);
      setFile(null);
      setAnalysis(null);
      setColumnMappings({});
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      const errorData = error.response?.data;
      let errorMessage = 'Error importing file: ' + (errorData?.message || error.message);
      
      if (errorData?.details) {
        if (errorData.details.errors && errorData.details.errors.length > 0) {
          errorMessage += '\n\nErrors that must be fixed:\n' + errorData.details.errors.join('\n');
        }
        if (errorData.details.warnings && errorData.details.warnings.length > 0) {
          errorMessage += '\n\nWarnings (automatically handled):\n' + errorData.details.warnings.join('\n');
        }
      } else if (errorData?.errors && Array.isArray(errorData.errors)) {
        errorMessage += '\n\nDetailed errors:\n' + errorData.errors.join('\n');
      }
      
      setMessage(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/import-export/export`, {
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
      const response = await axios.get(`${API_URL}/api/import-export/template`, {
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

  // Helper component for step indicators
  const StepIndicator = ({ stepNumber, isActive, isCompleted, title }) => (
    <div className={`flex items-center gap-2 ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        isCompleted ? 'bg-green-100 text-green-600' : 
        isActive ? 'bg-blue-100 text-blue-600' : 
        'bg-gray-100 text-gray-400'
      }`}>
        {isCompleted ? <CheckCircle size={16} /> : stepNumber}
      </div>
      <span className="font-medium">{title}</span>
    </div>
  );

  const currentStep = !file ? 1 : !isMappingValid ? 2 : 3;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Import/Export Data</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Import Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step Indicators */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Process</h2>
            <div className="grid grid-cols-3 gap-4">
              <StepIndicator stepNumber={1} isActive={currentStep === 1} isCompleted={currentStep > 1} title="Select File" />
              <StepIndicator stepNumber={2} isActive={currentStep === 2} isCompleted={currentStep > 2} title="Map Columns" />
              <StepIndicator stepNumber={3} isActive={currentStep === 3} isCompleted={false} title="Import" />
            </div>
          </div>

          {/* File Selection */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="text-blue-600" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">Step 1: Select CSV File</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">📋 What you can import:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Point redemptions data from any loyalty program</li>
                  <li>• Credit card point/mile usage records</li>
                  <li>• Hotel free night award bookings</li>
                  <li>• Travel credit redemptions</li>
                </ul>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="mx-auto text-gray-400 mb-2" size={32} />
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-sm text-gray-500 mt-2">
                  CSV files only. The system will automatically detect and map your columns.
                </p>
              </div>

              {isAnalyzing && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Analyzing file...</span>
                </div>
              )}
            </div>
          </div>

          {/* Column Mapping */}
          {analysis && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <ArrowRight className="text-blue-600" size={20} />
                <h2 className="text-xl font-semibold text-gray-900">Step 2: Map Your Columns</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-amber-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="text-amber-600" size={16} />
                    <h4 className="font-medium text-amber-900">Column Mapping Instructions</h4>
                  </div>
                  <p className="text-sm text-amber-800">
                    Match your CSV columns to the required fields below. Fields marked with ⭐ are required.
                    Optional fields will use default values if not mapped.
                  </p>
                </div>

                {/* Required Fields */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-red-500">⭐</span> Required Fields
                  </h3>
                  <div className="space-y-3">
                    {analysis.fieldDefinitions.required.map(field => (
                      <div key={field.key} className="border border-red-200 rounded-lg p-3 bg-red-50">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <label className="block font-medium text-gray-900 mb-1">
                              {field.label} <span className="text-red-500">*</span>
                            </label>
                            <p className="text-sm text-gray-600 mb-2">{field.description}</p>
                            <select
                              value={columnMappings[field.key] ?? ''}
                              onChange={(e) => handleMappingChange(field.key, e.target.value)}
                              className={`w-full rounded-md shadow-sm ${
                                columnMappings[field.key] !== undefined ? 
                                'border-green-300 focus:border-green-500 focus:ring-green-500' : 
                                'border-red-300 focus:border-red-500 focus:ring-red-500'
                              }`}
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
                          {columnMappings[field.key] !== undefined && (
                            <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={20} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optional Fields */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-blue-500">ℹ️</span> Optional Fields
                  </h3>
                  <div className="space-y-3">
                    {analysis.fieldDefinitions.optional.map(field => (
                      <div key={field.key} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <label className="block font-medium text-gray-700 mb-1">
                              {field.label}
                            </label>
                            <p className="text-sm text-gray-600 mb-2">{field.description}</p>
                            <select
                              value={columnMappings[field.key] ?? ''}
                              onChange={(e) => handleMappingChange(field.key, e.target.value)}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                              <option value="">Select column (optional)...</option>
                              {analysis.headers.map((header, index) => (
                                <option key={index} value={index}>
                                  {header}
                                </option>
                              ))}
                            </select>
                          </div>
                          {columnMappings[field.key] !== undefined && (
                            <CheckCircle className="text-blue-500 mt-1 flex-shrink-0" size={20} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Validation Feedback */}
                {mappingErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="text-red-500" size={16} />
                      <h4 className="font-medium text-red-900">Please complete required mappings:</h4>
                    </div>
                    <ul className="text-sm text-red-800 space-y-1">
                      {mappingErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Import Button */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleImport}
                    disabled={isImporting || !isMappingValid}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                      isMappingValid && !isImporting
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isImporting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Importing...
                      </div>
                    ) : (
                      `Step 3: Import ${analysis.totalRows} row${analysis.totalRows !== 1 ? 's' : ''}`
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Export Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Data</h2>
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">Download all your redemptions data as a CSV file for backup or analysis.</p>
              <button
                onClick={handleExport}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Download className="inline mr-2" size={16} />
                Export CSV
              </button>
            </div>
          </div>

          {/* Template Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Need Help?</h2>
            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <p className="font-medium text-gray-700">📄 Download Template</p>
                <p className="text-gray-600">Get a sample CSV file with the correct format and example data.</p>
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full text-blue-600 hover:text-blue-800 font-medium text-sm border border-blue-200 rounded-lg py-2 hover:bg-blue-50 transition-colors"
                >
                  Download Template
                </button>
              </div>
              
              <div className="text-sm space-y-2 pt-4 border-t border-gray-200">
                <p className="font-medium text-gray-700">💡 Tips for Success</p>
                <ul className="text-gray-600 space-y-1 text-xs">
                  <li>• Ensure your CSV has headers in the first row</li>
                  <li>• Dates can be in MM/DD/YYYY or MM/DD/YY format</li>
                  <li>• Dollar amounts can include commas and $ signs</li>
                  <li>• Point values should be numbers only</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`mt-6 p-4 rounded-lg whitespace-pre-line ${
          message.includes('Error') || message.includes('error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          <div className="flex items-start gap-2">
            {message.includes('Error') || message.includes('error') ? 
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} /> :
              <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
            }
            <div className="flex-1">{message}</div>
          </div>
        </div>
      )}

      {/* Preview Table */}
      {analysis && (
        <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Data Preview</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {analysis.headers.map((header, index) => (
                    <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analysis.sampleRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={cell}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Showing sample data from your file. Total rows to import: <span className="font-medium">{analysis.totalRows}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default ImportExport; 