'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface BuyoutItem {
  id: number;
  name: string;
  category: string;
  inScope: boolean;
  submittalRequired: boolean;
  submittalType?: string;
  scopeReference?: string;
}

interface ParseResult {
  projectName: string;
  buyoutItems: BuyoutItem[];
  submittals: Array<{
    item: string;
    type: string;
    status: 'Required' | 'Optional';
  }>;
  exclusions: string[];
  warnings: string[];
}

export default function ScopePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    setResult(null);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png'],
    },
    multiple: true,
  });

  const parseScope = async () => {
    if (files.length === 0) return;
    
    setParsing(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/scope/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse scope');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse scope');
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Scope Upload & Buyout Generator</h1>
      
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className="text-blue-600">Drop the scope documents here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">Drag & drop scope of work documents here</p>
            <p className="text-sm text-gray-400">PDF or images (JPG, PNG)</p>
          </div>
        )}
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Selected Files:</h3>
          <ul className="space-y-2">
            {files.map((file, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-gray-400" />
                {file.name}
              </li>
            ))}
          </ul>
          <button
            onClick={parseScope}
            disabled={parsing}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {parsing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Parsing Scope...
              </>
            ) : (
              'Generate Buyout List'
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-6">
          {/* Buyout Items */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Buyout Checklist</h2>
            <div className="grid gap-2">
              {result.buyoutItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    item.inScope ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.inScope ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({item.category})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {item.submittalRequired && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Submittal: {item.submittalType}
                      </span>
                    )}
                    {item.inScope && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        In Scope
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submittals */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Submittal Register</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Item</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.submittals.map((sub, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">{sub.item}</td>
                    <td className="py-2 text-gray-600">{sub.type}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        sub.status === 'Required' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Exclusions */}
          {result.exclusions.length > 0 && (
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Exclusions (By Others)</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {result.exclusions.map((exc, i) => (
                  <li key={i}>{exc}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-yellow-800">⚠️ Items to Review</h2>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                {result.warnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Create Project from Scope
            </button>
            <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Export Buyout List
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
