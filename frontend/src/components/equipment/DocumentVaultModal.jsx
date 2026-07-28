import React, { useState } from 'react';
import api from '../../api';

export default function DocumentVaultModal({ isOpen, onClose, equipment, onSuccess }) {
  const [docFile, setDocFile] = useState(null);
  const [docTitle, setDocTitle] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !equipment) return null;

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docFile) {
      setError('Please select a file to upload.');
      return;
    }
    
    setUploadingDoc(true);
    setError('');
    
    const docData = new FormData();
    docData.append('equipment', equipment.id);
    docData.append('title', docTitle);
    docData.append('document', docFile);

    try {
      await api.post('equipment-documents/', docData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDocFile(null);
      setDocTitle('');
      onSuccess(); // triggers refresh
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              Upload Document
            </h3>
            <p className="text-sm text-slate-500 mt-1">{equipment.name} ({equipment.serial_number})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-full p-1 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-6">
          {error && <p className="text-sm text-rose-600 bg-rose-50 p-2 rounded mb-4">{error}</p>}
          <form onSubmit={handleUploadDocument} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Document Title</label>
              <input 
                required 
                type="text" 
                placeholder="e.g. Service Manual 2026"
                value={docTitle} 
                onChange={(e) => setDocTitle(e.target.value)} 
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">PDF / Document File</label>
              <input 
                required 
                type="file" 
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => setDocFile(e.target.files[0])} 
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" 
              />
            </div>
            <div className="flex justify-end pt-4 gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button 
                type="submit" 
                disabled={uploadingDoc}
                className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
              >
                {uploadingDoc ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
