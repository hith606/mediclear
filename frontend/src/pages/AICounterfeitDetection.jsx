import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Sparkles, ShieldAlert, Cpu, Calculator, AlertTriangle, AlertCircle } from 'lucide-react';

const AICounterfeitDetection = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Risk Calculator State
  const [calcForm, setCalcForm] = useState({
    supplier_rating: 95,
    price_discrepancy_percent: 5,
    transit_temp_anomaly: false,
    failed_scans: 0
  });
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.ai.getAnomalies();
      setAnomalies(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCalculateRisk = async (e) => {
    e.preventDefault();
    setCalcLoading(true);
    setCalcResult(null);
    try {
      const res = await api.ai.predictRisk(calcForm);
      setCalcResult(res.data);
    } catch (err) {
      alert("Failed to compute risk: " + (err.response?.data?.detail || err.message));
    } finally {
      setCalcLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white font-sans">AI Counterfeit Detection Center</h1>
        <p className="text-sm text-gray-400 mt-1">
          Reviews Isolation Forest alerts on scan history and runs predictive Random Forest classifications to compute supplier risk indexes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Anomaly Log Feed */}
        <div className="lg:col-span-2 rounded-2xl glass-panel border border-accent-500/10 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-[#1e293b] bg-accent-950/5 flex items-center gap-3">
            <ShieldAlert className="text-accent-400 pulse-indicator" size={18} />
            <h2 className="font-bold text-white">AI Exception Alert Feed (Isolation Forest)</h2>
          </div>
          {anomalies.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm flex-1 flex flex-col justify-center items-center gap-2">
              <Cpu size={32} className="text-gray-800" />
              <span>No scan behavior exceptions currently flagged by ML models.</span>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-[#151c2c] text-xs font-semibold text-gray-300 border-b border-[#1e293b] uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Serial Number</th>
                    <th className="px-6 py-3.5">Batch</th>
                    <th className="px-6 py-3.5">Scan Count</th>
                    <th className="px-6 py-3.5">Last Scanned</th>
                    <th className="px-6 py-3.5">ML Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b] font-mono text-xs">
                  {anomalies.map((a) => (
                    <tr key={a._id} className="hover:bg-[#151c2c]/30">
                      <td className="px-6 py-4 font-semibold text-white truncate max-w-[180px]">{a.serial_number}</td>
                      <td className="px-6 py-4">{a.batch_number}</td>
                      <td className="px-6 py-4 text-center font-semibold text-accent-400">{a.scan_count} times</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(a.last_scanned).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-accent-500/10 text-accent-400 border-accent-500/20 uppercase tracking-wide">
                          Outlier
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Risk Score Calculator */}
        <div className="p-6 rounded-2xl glass-panel border border-[#1e293b] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calculator size={20} className="text-primary-500" />
              Risk Index Calculator
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Assesses transaction risk level by submitting supplier parameters to the pre-trained Random Forest classifier.
            </p>

            <form onSubmit={handleCalculateRisk} className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] text-gray-400 font-semibold mb-1 uppercase">Supplier reputation rating (0-100)</label>
                <input
                  type="number" required min="0" max="100"
                  value={calcForm.supplier_rating}
                  onChange={e => setCalcForm({...calcForm, supplier_rating: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-1.5 text-xs bg-[#151c2c] border border-[#222f47] rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-semibold mb-1 uppercase">Price Deviation percentage (%)</label>
                <input
                  type="number" required min="0" max="200"
                  value={calcForm.price_discrepancy_percent}
                  onChange={e => setCalcForm({...calcForm, price_discrepancy_percent: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-1.5 text-xs bg-[#151c2c] border border-[#222f47] rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-semibold mb-1 uppercase">Transit failures / Failed scans count</label>
                <input
                  type="number" required min="0" max="50"
                  value={calcForm.failed_scans}
                  onChange={e => setCalcForm({...calcForm, failed_scans: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-1.5 text-xs bg-[#151c2c] border border-[#222f47] rounded-lg text-white"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-[#151c2c]/40 border border-[#222f47]/50 rounded-lg">
                <span className="text-[10px] text-gray-400 font-semibold uppercase">Cold chain temp spike?</span>
                <input
                  type="checkbox"
                  checked={calcForm.transit_temp_anomaly}
                  onChange={e => setCalcForm({...calcForm, transit_temp_anomaly: e.target.checked})}
                  className="w-4 h-4 text-primary-500 rounded bg-[#0b0f19] border-[#222f47] focus:ring-transparent"
                />
              </div>

              <button
                type="submit" disabled={calcLoading}
                className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Cpu size={14} />
                <span>{calcLoading ? 'Computing Model Classifier...' : 'Calculate Risk Index'}</span>
              </button>
            </form>
          </div>

          {/* Calculator Results */}
          {calcResult && (
            <div className="p-4 bg-[#151c2c]/60 border border-gray-800 rounded-xl space-y-3 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Predicted Risk Score:</span>
                <span className={`text-lg font-extrabold ${
                  ['High', 'Critical'].includes(calcResult.risk_level) ? 'text-accent-400' : 'text-green-400'
                }`}>
                  {(calcResult.risk_score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Risk Assessment Category:</span>
                <span className={`font-bold uppercase ${
                  ['High', 'Critical'].includes(calcResult.risk_level) ? 'text-accent-400 pulse-indicator' : 'text-green-400'
                }`}>
                  {calcResult.risk_level}
                </span>
              </div>
              <div className="text-[10px] text-gray-500 leading-normal border-t border-[#222f47] pt-2">
                Indicators: {calcResult.details}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AICounterfeitDetection;
