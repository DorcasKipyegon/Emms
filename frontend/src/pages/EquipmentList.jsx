import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import api from '../api';

export default function EquipmentList() {
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add Equipment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    serial_number: '',
    category: '',
    location: '',
    status: 'OPERATIONAL'
  });
  const [formError, setFormError] = useState('');

  // Bulk Upload Modal State
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [csvResult, setCsvResult] = useState(null);

  // Document Vault Modal State
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [vaultEquipment, setVaultEquipment] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [docTitle, setDocTitle] = useState('');

  // Update Runtime Modal State
  const [isRuntimeOpen, setIsRuntimeOpen] = useState(false);
  const [runtimeEquipment, setRuntimeEquipment] = useState(null);
  const [newRuntime, setNewRuntime] = useState('');
  const [updatingRuntime, setUpdatingRuntime] = useState(false);
  const [runtimeError, setRuntimeError] = useState('');

  const fetchEquipment = async () => {
    try {
      const response = await api.get('equipment/');
      setEquipment(response.data);
    } catch (err) {
      setError('Failed to load equipment data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('categories/');
      setCategories(response.data);
    } catch (err) {
      console.error("Could not fetch categories", err);
    }
  };

  useEffect(() => {
    fetchEquipment();
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('equipment/', formData);
      setIsModalOpen(false);
      // Reset form
      setFormData({ name: '', serial_number: '', category: '', location: '', status: 'OPERATIONAL' });
      // Refresh list
      fetchEquipment();
    } catch (err) {
      setFormError('Failed to add equipment. Ensure serial number is unique and all fields are filled.');
      console.error(err);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = "name,serial_number,manufacturer,model_number,category,status,location\n";
    const sampleData = "Forklift A,FL-001,Toyota,8FGU25,Forklifts,OPERATIONAL,Warehouse A\nPump B,PMP-002,Goulds,3196,Pumps,MAINTENANCE,Boiler Room\n";
    const blob = new Blob([headers + sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'equipment_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    
    setUploadingCsv(true);
    setCsvResult(null);
    const data = new FormData();
    data.append('file', csvFile);

    try {
      const res = await api.post('equipment/bulk_upload/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCsvResult({ type: 'success', message: res.data.message });
      setCsvFile(null);
      fetchEquipment();
      fetchCategories(); 
    } catch (err) {
      console.error(err);
      setCsvResult({ type: 'error', message: err.response?.data?.error || 'Upload failed.' });
    } finally {
      setUploadingCsv(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docFile || !docTitle) return;
    
    setUploadingDoc(true);
    const data = new FormData();
    data.append('equipment', vaultEquipment.id);
    data.append('title', docTitle);
    data.append('document', docFile);

    try {
      await api.post('documents/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDocFile(null);
      setDocTitle('');
      fetchEquipment(); 
      const res = await api.get(`equipment/${vaultEquipment.id}/`);
      setVaultEquipment(res.data);
    } catch (err) {
      console.error("Failed to upload document", err);
      alert("Failed to upload document.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    
    try {
      await api.delete(`documents/${docId}/`);
      fetchEquipment();
      const res = await api.get(`equipment/${vaultEquipment.id}/`);
      setVaultEquipment(res.data);
    } catch (err) {
      console.error("Failed to delete document", err);
    }
  };

  const handleUpdateRuntime = async (e) => {
    e.preventDefault();
    setRuntimeError('');
    setUpdatingRuntime(true);
    
    try {
      await api.patch(`equipment/${runtimeEquipment.id}/update_runtime/`, {
        current_runtime_hours: newRuntime
      });
      setIsRuntimeOpen(false);
      setNewRuntime('');
      fetchEquipment();
    } catch (err) {
      console.error(err);
      setRuntimeError(err.response?.data?.error || 'Failed to update runtime.');
    } finally {
      setUpdatingRuntime(false);
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Serial Number', accessor: 'serial_number' },
    { header: 'Category', accessor: 'category_name' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          row.status === 'OPERATIONAL' ? 'bg-white text-emerald-600 border border-emerald-200' : 
          row.status === 'DOWN' ? 'bg-white text-rose-600 border border-rose-200' : 
          'bg-white text-amber-600 border border-amber-200'
        }`}>
          {row.status}
        </span>
      )
    },
    { header: 'Location', accessor: 'location' },
    { header: 'Runtime (Hrs)', accessor: 'current_runtime_hours' },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button 
            onClick={() => { setRuntimeEquipment(row); setNewRuntime(row.current_runtime_hours || ''); setIsRuntimeOpen(true); }}
            className="text-amber-600 hover:text-amber-800 text-sm font-medium flex items-center bg-amber-50 px-3 py-1 rounded-full border border-amber-200 transition-colors"
          >
            ⏱️ Hours
          </button>
          <button 
            onClick={() => { setVaultEquipment(row); setIsVaultOpen(true); }}
            className="text-teal-600 hover:text-teal-800 text-sm font-medium flex items-center bg-teal-50 px-3 py-1 rounded-full border border-teal-200 transition-colors"
          >
            📎 Vault ({row.documents?.length || 0})
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Equipment Fleet</h2>
          <p className="text-gray-500 mt-1">Manage and track all company machinery.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-teal-400 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-teal-900/20 flex items-center"
          >
            + Add Equipment
          </button>
          <button 
            onClick={() => setIsBulkUploadOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-emerald-900/20 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            Import CSV
          </button>
          <div className="relative flex-grow md:flex-grow-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full md:w-64"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/50 text-rose-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <DataTable columns={columns} data={equipment.filter(eq => 
          eq.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          eq.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (eq.category_name && eq.category_name.toLowerCase().includes(searchQuery.toLowerCase()))
        )} />
      )}

      {/* Add Equipment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Add New Equipment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <p className="text-sm text-rose-600 bg-rose-50 p-2 rounded">{formError}</p>}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-1 focus:ring-teal-500 focus:outline-none" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                <input required type="text" name="serial_number" value={formData.serial_number} onChange={handleInputChange} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-1 focus:ring-teal-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select required name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-1 focus:ring-teal-500 focus:outline-none">
                  <option value="">Select a category...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input required type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-1 focus:ring-teal-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-1 focus:ring-teal-500 focus:outline-none">
                  <option value="OPERATIONAL">Operational</option>
                  <option value="MAINTENANCE">In Maintenance</option>
                  <option value="DOWN">Down</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                <button type="submit" className="bg-teal-400 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Save Equipment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkUploadOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Bulk Upload Equipment</h3>
              <button onClick={() => setIsBulkUploadOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-full p-1 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-bold text-teal-800 mb-1">Need the correct format?</h4>
                <p className="text-xs text-teal-700 mb-3">Download the template to see exactly how your columns should be named. Any missing categories will be created automatically.</p>
                <button 
                  onClick={handleDownloadTemplate}
                  className="bg-white border border-teal-300 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                  Download Sample CSV
                </button>
              </div>

              {csvResult && (
                <div className={`p-3 rounded-lg text-sm ${csvResult.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  {csvResult.message}
                </div>
              )}

              <form onSubmit={handleBulkUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
                  <input 
                    required 
                    type="file" 
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files[0])} 
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" 
                  />
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsBulkUploadOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Close</button>
                  <button 
                    type="submit" 
                    disabled={uploadingCsv || !csvFile}
                    className="bg-teal-400 hover:bg-teal-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center"
                  >
                    {uploadingCsv ? 'Uploading...' : 'Upload Data'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Document Vault Modal */}
      {isVaultOpen && vaultEquipment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  📎 Document Vault
                </h3>
                <p className="text-sm text-gray-500 mt-1">{vaultEquipment.name} ({vaultEquipment.serial_number})</p>
              </div>
              <button onClick={() => { setIsVaultOpen(false); setVaultEquipment(null); }} className="text-gray-400 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-full p-1 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Attached Documents</h4>
              
              {vaultEquipment.documents && vaultEquipment.documents.length > 0 ? (
                <ul className="space-y-3 mb-8">
                  {vaultEquipment.documents.map(doc => (
                    <li key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        <svg className="w-8 h-8 text-rose-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path></svg>
                        <div>
                          <a href={`http://localhost:8000${doc.document}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">
                            {doc.title}
                          </a>
                          <p className="text-xs text-gray-500">Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteDocument(doc.id)} className="text-gray-400 hover:text-rose-600 p-2 bg-white rounded-md border border-gray-200 hover:border-rose-200 shadow-sm transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 mb-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-gray-500 text-sm">No documents attached yet.</p>
                </div>
              )}

              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Upload New Manual/Schematic</h4>
              <form onSubmit={handleUploadDocument} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Title</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Service Manual 2026"
                    value={docTitle} 
                    onChange={(e) => setDocTitle(e.target.value)} 
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-1 focus:ring-teal-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PDF / Document File</label>
                  <input 
                    required 
                    type="file" 
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => setDocFile(e.target.files[0])} 
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" 
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <button 
                    type="submit" 
                    disabled={uploadingDoc}
                    className="bg-teal-400 hover:bg-teal-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm"
                  >
                    {uploadingDoc ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Uploading...
                      </>
                    ) : 'Upload Document'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Runtime Modal */}
      {isRuntimeOpen && runtimeEquipment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Update Runtime</h3>
              <button onClick={() => setIsRuntimeOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-full p-1 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateRuntime} className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-2">
                Update the meter reading for <span className="font-bold">{runtimeEquipment.name}</span>. 
                Current: {runtimeEquipment.current_runtime_hours} hrs.
              </p>
              {runtimeError && <p className="text-sm text-rose-600 bg-rose-50 p-2 rounded">{runtimeError}</p>}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Runtime Hours</label>
                <input 
                  required 
                  type="number" 
                  step="0.01"
                  min={runtimeEquipment.current_runtime_hours}
                  value={newRuntime} 
                  onChange={(e) => setNewRuntime(e.target.value)} 
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-1 focus:ring-teal-500 focus:outline-none" 
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsRuntimeOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                <button 
                  type="submit" 
                  disabled={updatingRuntime}
                  className="bg-teal-400 hover:bg-teal-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm"
                >
                  {updatingRuntime ? 'Saving...' : 'Save Hours'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
