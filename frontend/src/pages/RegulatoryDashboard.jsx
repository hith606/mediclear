import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  ShieldAlert, AlertTriangle, AlertCircle, FileText, Download, 
  Map, TrendingUp, BarChart as ChartIcon, Search
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

const COLORS = ['#10b981', '#ef4444'];

const RegulatoryDashboard = () => {
  const [stats, setStats] = useState(null);
  const [highRisk, setHighRisk] = useState([]);
  const [mapPoints, setMapPoints] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [recallBatchNum, setRecallBatchNum] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [recallLoading, setRecallLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.regulatory.getStats();
      setStats(statsRes.data);

      const riskRes = await api.regulatory.getHighRisk();
      setHighRisk(riskRes.data);

      const mapRes = await api.regulatory.getMapPoints();
      setMapPoints(mapRes.data);

      const chartRes = await api.regulatory.getStatistics();
      setChartData(chartRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecallSubmit = async (e) => {
    e.preventDefault();
    if (!recallBatchNum) return;
    setError(''); setSuccess(''); setRecallLoading(true);
    try {
      const res = await api.regulatory.recallBatch(recallBatchNum);
      setSuccess(res.data.message);
      setRecallBatchNum('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to issue recall order.');
    } finally {
      setRecallLoading(false);
    }
  };

  const handleExportPDF = () => {
    const url = api.regulatory.getPDFExportUrl();
    // Open in a new tab or trigger direct download window
    window.open(url, '_blank');
  };

  if (loading || !chartData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-sans">National Recall & Auditing System</h1>
          <p className="text-sm text-gray-400 mt-1">
            Monitors pharmaceutical manufacturers, executes bulk recall mandates, and reviews AI outlier metrics.
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#151c2c] hover:bg-[#1f293d] border border-primary-500/20 hover:border-primary-500/40 text-primary-400 text-sm font-semibold rounded-xl transition-all"
        >
          <Download size={16} />
          <span>Export Audit PDF</span>
        </button>
      </div>

      {/* Alert panels */}
      {success && <div className="p-4 bg-green-950/25 border border-green-500/30 text-green-400 rounded-xl text-xs font-semibold">{success}</div>}
      {error && <div className="p-4 bg-accent-900/25 border border-accent-500/30 text-accent-400 rounded-xl text-xs font-semibold">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Statistics Charts */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-panel border border-[#1e293b] space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ChartIcon size={20} className="text-primary-500" />
            Supply Chain Verification Metrics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart: Ratio */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block text-center">Scan Authenticity Ratio</span>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.scan_ratio}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.scan_ratio.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#151c2c', borderColor: '#222f47', color: '#fff' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart: Trends */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block text-center">Monthly Scan Trends</span>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.monthly_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222f47" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#151c2c', borderColor: '#222f47', color: '#fff' }} />
                    <Legend />
                    <Bar dataKey="authentic" fill="#10b981" name="Authentic" />
                    <Bar dataKey="suspicious" fill="#ef4444" name="Anomalous" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Recall Trigger Tool */}
        <div className="p-6 rounded-2xl glass-panel border border-[#1e293b] flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert size={20} className="text-accent-500" />
              Automated Recall System
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Instantly blacklist a drug batch by its serialization number. 
              Executing a recall immediately invalidates consumer lookup scans and dispatches automated alerts to all logistic nodes holding inventory of the batch.
            </p>
          </div>

          <form onSubmit={handleRecallSubmit} className="space-y-4 mt-6">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Enter Target Batch Number</label>
              <input
                type="text" required placeholder="e.g. B-ASP-001"
                value={recallBatchNum}
                onChange={e => setRecallBatchNum(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-accent-500 text-center font-mono"
              />
            </div>

            <button
              type="submit" disabled={recallLoading}
              className="w-full py-2.5 bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold rounded-xl transition-all"
            >
              {recallLoading ? 'Publishing Recall Alerts...' : 'Execute Recall Mandate'}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* High Risk Suppliers List */}
        <div className="lg:col-span-2 rounded-2xl glass-panel border border-[#1e293b] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1e293b] bg-[#151c2c]/10">
            <h2 className="font-bold text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-500" />
              Supplier Risk Rating Matrix
            </h2>
          </div>
          {highRisk.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">All registered suppliers operating within safe standard thresholds.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-[#151c2c] text-xs font-semibold text-gray-300 border-b border-[#1e293b] uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Manufacturer</th>
                    <th className="px-6 py-3.5">Registered Batches</th>
                    <th className="px-6 py-3.5">Recalls logged</th>
                    <th className="px-6 py-3.5">Incident Rate</th>
                    <th className="px-6 py-3.5">Risk Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {highRisk.map((r) => (
                    <tr key={r.manufacturer_id} className="hover:bg-[#151c2c]/20">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{r.manufacturer_name}</div>
                        <div className="text-[10px] text-gray-500">{r.organization}</div>
                      </td>
                      <td className="px-6 py-4">{r.total_batches}</td>
                      <td className="px-6 py-4 text-accent-400 font-semibold">{r.recall_count}</td>
                      <td className="px-6 py-4">{r.recall_rate}%</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
                          r.risk_status === 'High Risk'
                            ? 'bg-accent-500/10 text-accent-400 border-accent-500/20 pulse-indicator'
                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                          {r.risk_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Counterfeiting Geolocation Incident Log */}
        <div className="p-6 rounded-2xl glass-panel border border-[#1e293b] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Map size={18} className="text-primary-500" />
              Incident Geolocation Feed
            </h3>
            <p className="text-xs text-gray-400">
              Real-time feed of suspicious verification logs and reported counterfeit coords.
            </p>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {mapPoints.map((point) => (
                <div key={point.report_id} className="p-3 bg-[#151c2c] border border-gray-800 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{point.medicine_name}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${
                      point.risk_level === 'Critical' 
                        ? 'bg-accent-500/10 text-accent-400 border-accent-500/20' 
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {point.risk_level}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400">Location: {point.location_name}</div>
                  <div className="text-[9px] text-gray-500 flex justify-between font-mono">
                    <span>Coords: {point.latitude?.toFixed(4)}, {point.longitude?.toFixed(4)}</span>
                    <span>{new Date(point.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {mapPoints.length === 0 && (
                <div className="text-center text-xs text-gray-500 py-6">No incident points logged.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegulatoryDashboard;
