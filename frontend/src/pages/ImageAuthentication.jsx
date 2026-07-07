import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Image, Upload, ShieldCheck, HelpCircle, Layers, AlertCircle, FileText } from 'lucide-react';

const ImageAuthentication = () => {
  const [catalog, setCatalog] = useState([]);
  const [sku, setSku] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCatalog = async () => {
    try {
      const res = await api.medicine.getCatalog();
      setCatalog(res.data);
      if (res.data.length > 0) {
        setSku(res.data[0].sku);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setError('Please select an image file to compare.');
      return;
    }
    setError(''); setResult(null); setLoading(true);

    const formData = new FormData();
    formData.append('file', imageFile);
    if (sku) {
      formData.append('medicine_sku', sku);
    }

    try {
      const res = await api.opencv.verifyPackage(formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Package comparison pipeline failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white font-sans">OpenCV Packaging Authenticator</h1>
        <p className="text-sm text-gray-400 mt-1">
          Compares physical box packaging against reference graphic standards using ORB keypoint grids, HSV color histograms, and label OCR readings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Column */}
        <div className="p-6 rounded-2xl glass-panel border border-[#1e293b] space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload size={20} className="text-primary-500" />
            Upload Package Photo
          </h2>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Select Target Medicine profile</label>
              <select
                value={sku}
                onChange={e => setSku(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">-- No specific catalog matching (Simulated template comparison) --</option>
                {catalog.map(c => <option key={c.sku} value={c.sku}>{c.name} ({c.sku})</option>)}
              </select>
            </div>

            <div className="border-2 border-dashed border-[#222f47] hover:border-primary-500/50 rounded-xl p-8 text-center transition-colors relative overflow-hidden min-h-[220px] flex items-center justify-center">
              <input
                type="file" accept="image/*" id="package-img"
                onChange={handleFileChange}
                className="hidden"
              />
              {imagePreview ? (
                <div className="relative group w-full h-full max-h-[250px]">
                  <img src={imagePreview} alt="Preview" className="mx-auto max-h-[240px] rounded-lg object-contain" />
                  <label htmlFor="package-img" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-xs font-semibold text-white">
                    Replace Photo
                  </label>
                </div>
              ) : (
                <label htmlFor="package-img" className="cursor-pointer block space-y-3">
                  <div className="inline-flex p-3.5 bg-primary-600/10 rounded-full text-primary-400"><Image size={24} /></div>
                  <div className="text-sm font-semibold text-white">Click or drag package photo here</div>
                  <div className="text-xs text-gray-500">Supports JPG, PNG, WebP up to 8MB</div>
                </label>
              )}
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 font-semibold text-white text-sm rounded-xl transition-all"
            >
              {loading ? 'Running Computer Vision Pipeline...' : 'Verify Package Authenticity'}
            </button>
          </form>
          {error && <div className="p-4 bg-accent-900/25 border border-accent-500/30 text-accent-400 rounded-xl text-xs font-semibold">{error}</div>}
        </div>

        {/* Results Column */}
        <div className="p-6 rounded-2xl glass-panel border border-[#1e293b] flex flex-col justify-center min-h-[400px]">
          {loading ? (
            <div className="text-center space-y-4 py-8">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-gray-400 font-medium">Extracting contour points & comparing pixel distributions...</p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Score Header */}
              <div className="text-center border-b border-[#1e293b] pb-6 space-y-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Security Index score:</span>
                <div className="flex justify-center items-baseline gap-1">
                  <span className={`text-5xl font-extrabold ${result.confidence_score >= 75.0 ? 'text-green-500' : 'text-accent-500'}`}>
                    {result.confidence_score}%
                  </span>
                </div>
                <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border uppercase ${
                  result.verdict === 'Authentic' 
                    ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                    : 'bg-accent-500/10 text-accent-400 border-accent-500/20 pulse-indicator'
                }`}>
                  {result.verdict}
                </div>
              </div>

              {/* CV Breakdown Metrics */}
              <div className="space-y-3">
                <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">OpenCV Analysis breakdown:</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#151c2c] border border-gray-800 rounded-xl">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Color HSV correlation</span>
                    <span className="text-lg font-bold text-white mt-1 block">{result.color_similarity}%</span>
                  </div>
                  <div className="p-4 bg-[#151c2c] border border-gray-800 rounded-xl">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">ORB Keypoint matches</span>
                    <span className="text-lg font-bold text-white mt-1 block">{result.feature_match_score}%</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${result.tamper_detected ? 'bg-accent-950/20 border-accent-500/20 text-accent-400' : 'bg-green-950/20 border-green-500/20 text-green-400'}`}>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    <span>Structural Wrapper Check:</span>
                  </div>
                  <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">{result.tamper_details}</p>
                </div>
              </div>

              {/* EasyOCR extracted values */}
              <div className="space-y-3 border-t border-[#1e293b] pt-6">
                <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                  <FileText size={14} />
                  <span>EasyOCR label extraction results:</span>
                </div>
                <div className="bg-[#151c2c] border border-gray-800 rounded-xl p-4 font-mono text-[11px] space-y-2 text-gray-300">
                  <div className="flex justify-between border-b border-[#222f47] pb-1.5">
                    <span className="text-gray-500">Read Batch number:</span>
                    <span className="text-white font-semibold">{result.extracted_label_data.batch_number}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#222f47] pb-1.5">
                    <span className="text-gray-500">Read Expiration date:</span>
                    <span className="text-white font-semibold">{result.extracted_label_data.expiry_date}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#222f47] pb-1.5">
                    <span className="text-gray-500">Read Strength:</span>
                    <span className="text-white font-semibold">{result.extracted_label_data.strength}</span>
                  </div>
                  <div className="pt-2 text-[10px] text-gray-500 max-h-[80px] overflow-y-auto leading-relaxed select-all">
                    Raw Stream: {result.extracted_label_data.raw_text}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center space-y-3 py-8 text-gray-500">
              <ShieldCheck size={40} className="mx-auto text-[#1e293b]" />
              <p className="text-xs">Submit a photo to execute feature-correlation audits.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageAuthentication;
