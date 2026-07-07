import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { QrCode, Download, ArrowLeft, Calendar, ShieldCheck, Tag } from 'lucide-react';

const BatchDetails = () => {
  const { batchNum } = useParams();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSerial, setSelectedSerial] = useState(null);

  const fetchDetails = async () => {
    try {
      const res = await api.medicine.getBatchDetails(batchNum);
      setDetails(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load batch serialization.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [batchNum]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-accent-900/20 border border-accent-500/20 text-accent-400 rounded-xl text-center">
        <ArrowLeft className="cursor-pointer inline-block mb-3" onClick={() => window.history.back()} />
        <p className="font-semibold text-sm">{error || 'Batch serialization record not found.'}</p>
      </div>
    );
  }

  const { batch, qrs } = details;

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link to="/batches" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors">
        <ArrowLeft size={16} />
        <span>Return to Batch Registry</span>
      </Link>

      {/* Batch Overview Card */}
      <div className="p-6 rounded-2xl glass-panel border border-[#1e293b] flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-primary-600/10 border border-primary-500/20 rounded-xl text-primary-400">
              <Tag size={20} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-white font-sans">Batch {batch.batch_number}</h1>
              <p className="text-xs text-gray-400">Registered SKU: <strong className="text-white">{batch.medicine_sku}</strong></p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 text-xs text-gray-400 pt-2">
            <span className="flex items-center gap-1.5"><Calendar size={14} /> Manufactured: {batch.manufacture_date.split('T')[0]}</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} /> Expiration: {batch.expiry_date.split('T')[0]}</span>
          </div>
        </div>

        <div className="text-right space-y-1.5">
          <div className="text-xs text-gray-400 font-semibold">Total Serialized Output:</div>
          <div className="text-2xl font-extrabold text-white">{batch.quantity} units</div>
          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
            batch.status === 'Active' 
              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
              : 'bg-accent-500/10 text-accent-400 border-accent-500/20'
          }`}>
            Status: {batch.status}
          </span>
        </div>
      </div>

      {/* QR Codes Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <QrCode size={18} className="text-primary-400" />
          Production Line QR Label Serialization Ledger
        </h2>
        <p className="text-xs text-gray-400">
          Showing unit QR labels. Click any code below to expand a high-resolution print overlay.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {qrs.map((item) => (
            <div 
              key={item.serial}
              onClick={() => setSelectedSerial(item)}
              className="p-4 rounded-xl glass-card flex flex-col items-center gap-3 cursor-pointer text-center relative group"
            >
              <div className="bg-white p-2 rounded-lg relative overflow-hidden">
                <img src={item.qr_base64} alt={item.serial} className="w-24 h-24" />
                <div className="absolute inset-0 bg-[#0b0f19]/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-semibold text-primary-400">Inspect</span>
                </div>
              </div>
              <div className="text-[10px] font-semibold text-gray-400 truncate w-full select-all font-mono">
                {item.serial.split('-').pop()}
              </div>
            </div>
          ))}
        </div>
        {batch.quantity > 50 && (
          <p className="text-center text-xs text-gray-500 pt-4">
            Truncated at 50 labels. Complete listing containing all {batch.quantity} codes can be exported as database reports.
          </p>
        )}
      </div>

      {/* Modal Inspector Overlay */}
      {selectedSerial && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl glass-panel border border-[#1e293b] text-center space-y-6">
            <h3 className="text-lg font-bold text-white font-sans">Print Serial Label</h3>
            
            <div className="inline-block bg-white p-6 rounded-xl border border-[#1e293b]">
              <img src={selectedSerial.qr_base64} alt={selectedSerial.serial} className="w-48 h-48" />
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-gray-400 block uppercase font-semibold tracking-wide">Unique Global QR Code Hash:</span>
              <code className="text-white block bg-[#151c2c] border border-gray-800 p-2 rounded font-mono select-all">
                {selectedSerial.serial}
              </code>
            </div>

            <div className="flex gap-3">
              <a 
                href={selectedSerial.qr_base64} 
                download={`label-${selectedSerial.serial}.png`}
                className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Download size={14} />
                <span>Save PNG</span>
              </a>
              <button 
                onClick={() => setSelectedSerial(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 font-semibold rounded-xl text-sm transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchDetails;
