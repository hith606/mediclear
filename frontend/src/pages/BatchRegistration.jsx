import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { QrCode, FileText, Upload, Plus, Download, ChevronRight, Layers, Table } from 'lucide-react';
import { Link } from 'react-router-dom';

const BatchRegistration = () => {
  const [catalog, setCatalog] = useState([]);
  const [batches, setBatches] = useState([]);
  const [activeTab, setActiveTab] = useState('register-batch');
  
  // Single Drug Form
  const [drugForm, setDrugForm] = useState({
    name: '', generic_name: '', sku: '', formulation: 'Tablet', strength: '', active_ingredients: '', description: ''
  });
  // Single Batch Form
  const [batchForm, setBatchForm] = useState({
    batch_number: '', medicine_sku: '', quantity: 10, manufacture_date: '', expiry_date: ''
  });
  // CSV Upload
  const [csvFile, setCsvFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCatalogAndBatches = async () => {
    try {
      const catRes = await api.medicine.getCatalog();
      setCatalog(catRes.data);
      const batRes = await api.medicine.getBatches();
      setBatches(batRes.data);
      
      // Auto-set first SKU if available
      if (catRes.data.length > 0) {
        setBatchForm(prev => ({ ...prev, medicine_sku: catRes.data[0].sku }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCatalogAndBatches();
  }, []);

  const handleDrugSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const ingredients = drugForm.active_ingredients.split(',').map(i => i.trim());
      await api.medicine.createCatalog({ ...drugForm, active_ingredients: ingredients });
      setSuccess('Drug registered successfully in national catalog!');
      setDrugForm({ name: '', generic_name: '', sku: '', formulation: 'Tablet', strength: '', active_ingredients: '', description: '' });
      await fetchCatalogAndBatches();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register drug.');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      // Ensure ISO string dates
      const mfg = new Date(batchForm.manufacture_date).toISOString();
      const exp = new Date(batchForm.expiry_date).toISOString();
      
      const res = await api.medicine.createBatch({
        ...batchForm,
        manufacture_date: mfg,
        expiry_date: exp
      });
      setSuccess(`Batch ${batchForm.batch_number} created with ${batchForm.quantity} serial units!`);
      setBatchForm({ batch_number: '', medicine_sku: catalog[0]?.sku || '', quantity: 10, manufacture_date: '', expiry_date: '' });
      await fetchCatalogAndBatches();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register batch.');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setError('Please select a CSV file.');
      return;
    }
    setError(''); setSuccess(''); setLoading(true);
    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const res = await api.medicine.bulkUploadBatches(formData);
      setSuccess(res.data.message);
      setCsvFile(null);
      await fetchCatalogAndBatches();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'object' ? `${detail.message} - Errors: ${detail.errors.join(', ')}` : detail || 'CSV Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white font-sans">Medicine Serializer & Batch Board</h1>
        <p className="text-sm text-gray-400 mt-1">Register chemical drug profiles, generate QR serials, and download production-line labels.</p>
      </div>

      {/* Alert Messages */}
      {success && <div className="p-4 bg-green-950/25 border border-green-500/30 text-green-400 rounded-xl text-xs font-semibold">{success}</div>}
      {error && <div className="p-4 bg-accent-900/25 border border-accent-500/30 text-accent-400 rounded-xl text-xs font-semibold">{error}</div>}

      {/* Tabs */}
      <div className="flex border-b border-[#1e293b] gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('register-batch')}
          className={`pb-4 px-4 text-sm font-semibold transition-all ${activeTab === 'register-batch' ? 'text-primary-400 border-b-2 border-primary-500' : 'text-gray-400 hover:text-gray-200'}`}
        >
          Generate Serialization Batch
        </button>
        <button
          onClick={() => setActiveTab('register-drug')}
          className={`pb-4 px-4 text-sm font-semibold transition-all ${activeTab === 'register-drug' ? 'text-primary-400 border-b-2 border-primary-500' : 'text-gray-400 hover:text-gray-200'}`}
        >
          Register Drug Profile
        </button>
        <button
          onClick={() => setActiveTab('batches-list')}
          className={`pb-4 px-4 text-sm font-semibold transition-all ${activeTab === 'batches-list' ? 'text-primary-400 border-b-2 border-primary-500' : 'text-gray-400 hover:text-gray-200'}`}
        >
          View Registered Batches
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'register-batch' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="p-6 rounded-2xl glass-panel border border-[#1e293b] space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <QrCode size={20} className="text-primary-500" />
              Single Batch Serialization
            </h2>
            {catalog.length === 0 ? (
              <div className="p-4 bg-yellow-950/20 border border-yellow-800/25 rounded-xl text-yellow-500 text-xs leading-relaxed">
                ⚠️ Catalogue Empty: You must register a Drug Profile before you can generate a manufacturing batch.
              </div>
            ) : (
              <form onSubmit={handleBatchSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Batch Number</label>
                    <input
                      type="text" required placeholder="e.g. B-ASP-001"
                      value={batchForm.batch_number}
                      onChange={e => setBatchForm({...batchForm, batch_number: e.target.value})}
                      className="w-full px-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Select Drug SKU</label>
                    <select
                      value={batchForm.medicine_sku}
                      onChange={e => setBatchForm({...batchForm, medicine_sku: e.target.value})}
                      className="w-full px-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500"
                    >
                      {catalog.map(c => <option key={c.sku} value={c.sku}>{c.name} ({c.sku})</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Production Quantity (Units to Serialize)</label>
                  <input
                    type="number" required min="1" max="1000"
                    value={batchForm.quantity}
                    onChange={e => setBatchForm({...batchForm, quantity: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Manufacture Date</label>
                    <input
                      type="date" required
                      value={batchForm.manufacture_date}
                      onChange={e => setBatchForm({...batchForm, manufacture_date: e.target.value})}
                      className="w-full px-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Expiry Date</label>
                    <input
                      type="date" required
                      value={batchForm.expiry_date}
                      onChange={e => setBatchForm({...batchForm, expiry_date: e.target.value})}
                      className="w-full px-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 font-semibold text-white text-sm rounded-xl transition-all"
                >
                  {loading ? 'Generating Serial QR codes...' : 'Generate Serialization Ledger'}
                </button>
              </form>
            )}
          </div>

          {/* Bulk CSV Upload */}
          <div className="p-6 rounded-2xl glass-panel border border-[#1e293b] flex flex-col justify-between">
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload size={20} className="text-primary-500" />
                Bulk CSV Serialization Upload
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Upload batch specifications in bulk using a CSV spreadsheet. The system will auto-match catalog SKUs, 
                verify formatting, generate unit-level QR hashes, and create serialization scan entries.
              </p>
              
              <div className="bg-[#151c2c] border border-[#222f47] rounded-xl p-4">
                <p className="text-[10px] font-semibold text-primary-400 uppercase tracking-wide mb-2">Required CSV Column Fields:</p>
                <code className="text-[10px] text-gray-300 block bg-[#0b0f19] p-2.5 rounded border border-[#1e293b] select-all font-mono">
                  batch_number,medicine_sku,quantity,manufacture_date,expiry_date
                </code>
                <span className="text-[9px] text-gray-500 block mt-2">Example date format: YYYY-MM-DD</span>
              </div>
            </div>

            <form onSubmit={handleCsvUpload} className="space-y-4 mt-6">
              <div className="border-2 border-dashed border-[#222f47] hover:border-primary-500/50 rounded-xl p-6 text-center transition-colors">
                <input
                  type="file" accept=".csv" id="csv-input"
                  onChange={e => setCsvFile(e.target.files[0])}
                  className="hidden"
                />
                <label htmlFor="csv-input" className="cursor-pointer block space-y-2">
                  <div className="inline-flex p-3 bg-primary-600/10 rounded-full text-primary-400"><Upload size={20} /></div>
                  <div className="text-sm font-semibold text-white">{csvFile ? csvFile.name : 'Select CSV file'}</div>
                  <div className="text-xs text-gray-500">Max size 5MB</div>
                </label>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 font-semibold text-white text-sm rounded-xl transition-all"
              >
                {loading ? 'Processing CSV sheets...' : 'Upload & Parse Batches'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'register-drug' && (
        <div className="p-6 max-w-2xl mx-auto rounded-2xl glass-panel border border-[#1e293b] space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus size={20} className="text-primary-500" />
            Register Chemical Profile in Catalog
          </h2>
          <form onSubmit={handleDrugSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Medicine Brand Name</label>
                <input
                  type="text" required placeholder="e.g. Aspirin 500mg"
                  value={drugForm.name}
                  onChange={e => setDrugForm({...drugForm, name: e.target.value})}
                  className="w-full px-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Generic Salt Name</label>
                <input
                  type="text" required placeholder="e.g. Acetylsalicylic Acid"
                  value={drugForm.generic_name}
                  onChange={e => setDrugForm({...drugForm, generic_name: e.target.value})}
                  className="w-full px-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Unique Drug SKU</label>
                <input
                  type="text" required placeholder="e.g. SKU-ASP-500"
                  value={drugForm.sku}
                  onChange={e => setDrugForm({...drugForm, sku: e.target.value})}
                  className="w-full px-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Formulation type</label>
                <select
                  value={drugForm.formulation}
                  onChange={e => setDrugForm({...drugForm, formulation: e.target.value})}
                  className="w-full px-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Liquid">Liquid / Syrup</option>
                  <option value="Injection">Injection</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Dosage Strength</label>
                <input
                  type="text" required placeholder="e.g. 500mg, 10ml"
                  value={drugForm.strength}
                  onChange={e => setDrugForm({...drugForm, strength: e.target.value})}
                  className="w-full px-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Active Ingredients (Comma separated)</label>
              <input
                type="text" required placeholder="Acetylsalicylic Acid 500mg, Potato starch"
                value={drugForm.active_ingredients}
                onChange={e => setDrugForm({...drugForm, active_ingredients: e.target.value})}
                className="w-full px-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Therapeutic Description</label>
              <textarea
                rows="3" placeholder="Brief details about the drug composition, standard storage temperature, etc."
                value={drugForm.description}
                onChange={e => setDrugForm({...drugForm, description: e.target.value})}
                className="w-full px-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500 resize-none"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 font-semibold text-white text-sm rounded-xl transition-all"
            >
              {loading ? 'Registering Salt...' : 'Save Drug Profile to Network'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'batches-list' && (
        <div className="rounded-2xl glass-panel border border-[#1e293b] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1e293b] bg-[#151c2c]/10">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-primary-400" />
              Registered Manufacturing Batches
            </h2>
          </div>
          {batches.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No batches registered.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-[#151c2c] text-xs font-semibold text-gray-300 border-b border-[#1e293b] uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Batch Number</th>
                    <th className="px-6 py-3.5">Drug SKU</th>
                    <th className="px-6 py-3.5">Units</th>
                    <th className="px-6 py-3.5">Mfg Date</th>
                    <th className="px-6 py-3.5">Expiry Date</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Label Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {batches.map((b) => (
                    <tr key={b._id} className="hover:bg-[#151c2c]/20">
                      <td className="px-6 py-4 font-semibold text-white">
                        <Link to={`/batches/${b.batch_number}`} className="hover:underline text-primary-400 flex items-center gap-1">
                          <QrCode size={14} />
                          {b.batch_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4">{b.medicine_sku}</td>
                      <td className="px-6 py-4">{b.quantity}</td>
                      <td className="px-6 py-4">{b.manufacture_date.split('T')[0]}</td>
                      <td className="px-6 py-4">{b.expiry_date.split('T')[0]}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          b.status === 'Active' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                            : 'bg-accent-500/10 text-accent-400 border-accent-500/20'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/batches/${b.batch_number}`}
                          className="inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 font-semibold"
                        >
                          <span>Manage Serials</span>
                          <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchRegistration;
