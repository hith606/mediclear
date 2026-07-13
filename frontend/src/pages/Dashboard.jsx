import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Users, Layers, AlertCircle, TrendingUp, Check, X,
  Clock, ShieldAlert, Award, FileText, Download, QrCode,
  ShieldCheck, Search, Filter, Gauge, ClipboardCheck
} from 'lucide-react';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [batches, setBatches] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      setUser(JSON.parse(userString));
    }
  }, []);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch Activity Logs (all roles)
      const logsRes = await api.auth.getActivityLogs();
      setActivityLogs(logsRes.data);

      // 2. Fetch data based on role
      if (user.role === 'Regulatory Authority') {
        const statsRes = await api.regulatory.getStats();
        setStats(statsRes.data);

        const pendingRes = await api.auth.getPending();
        setPendingUsers(pendingRes.data);
      } else if (user.role === 'Manufacturer') {
        const batchesRes = await api.medicine.getBatches();
        setBatches(batchesRes.data);
      } else if (['Distributor', 'Pharmacy'].includes(user.role)) {
        const shipmentsRes = await api.tracking.getShipments();
        setShipments(shipmentsRes.data);
      }
    } catch (err) {
      console.error("Dashboard load error: ", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleApprove = async (userId, approve) => {
    setActionLoading(true);
    try {
      await api.auth.approve(userId, approve);
      // Re-fetch pending users
      const pendingRes = await api.auth.getPending();
      setPendingUsers(pendingRes.data);
      
      const statsRes = await api.regulatory.getStats();
      setStats(statsRes.data);
    } catch (err) {
      alert("Action failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 1. Pending Approval Lobby View
  if (user.role !== 'Consumer' && user.role !== 'Regulatory Authority' && user.status === 'Pending Approval') {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 rounded-2xl glass-panel border border-yellow-500/20 text-center glow-red">
        <div className="inline-flex p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-yellow-500 mb-6">
          <Clock size={40} className="animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-white font-sans">Verification in Progress</h1>
        <p className="text-sm text-gray-400 mt-3 leading-relaxed">
          Welcome to the MediClear network, <strong className="text-white">{user.full_name}</strong>. 
          Your request to operate as a verified <strong className="text-white">{user.role}</strong> node has been received 
          and is currently queued in the national approval registry.
        </p>
        <div className="bg-[#151c2c] border border-gray-800 rounded-xl p-4 my-6 text-left space-y-2">
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Node Registry Parameters:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="text-gray-400">Node Operator:</span><span className="text-white text-right">{user.username}</span>
            <span className="text-gray-400">Organization:</span><span className="text-white text-right">{user.organization}</span>
            <span className="text-gray-400">Email Address:</span><span className="text-white text-right">{user.email}</span>
            <span className="text-gray-400">Approval Status:</span><span className="text-yellow-500 text-right font-semibold">{user.status}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          We will contact you via email once the compliance review is finalized. Standard clearance time takes 1-2 hours.
        </p>
      </div>
    );
  }

  const isConsumer = user?.role === 'Consumer';

  const filteredLogs = activityLogs.filter(l => 
    l.username?.toLowerCase().includes(filterQuery.toLowerCase()) ||
    l.role?.toLowerCase().includes(filterQuery.toLowerCase()) ||
    l.action?.toLowerCase().includes(filterQuery.toLowerCase()) ||
    l.details?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const getActionChipClass = (action) => {
    const act = action?.toUpperCase() || '';
    if (act.includes('LOGIN')) {
      return 'bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-sans';
    }
    if (act.includes('HANDSHAKE') || act.includes('INTEGRITY') || act.includes('CHECK') || act.includes('RECEIVE')) {
      return 'bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-sans';
    }
    if (act.includes('UPDATE') || act.includes('CREATE') || act.includes('SHIP')) {
      return 'bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-sans';
    }
    return 'bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-sans';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className={`text-2xl font-extrabold font-sans tracking-tight ${isConsumer ? 'text-slate-800' : 'text-white'}`}>
          Operational Control Panel
        </h1>
        <p className={`text-sm mt-1 ${isConsumer ? 'text-slate-500' : 'text-gray-400'}`}>
          Hello, {user.full_name} ({user.role}) • {isConsumer ? 'Node status active and logging in real-time.' : 'Node status active.'}
        </p>
      </div>

      {/* 2. REGULATOR VIEW */}
      {user.role === 'Regulatory Authority' && stats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl glass-panel border border-[#1e293b] flex items-center gap-5">
              <div className="p-3.5 bg-primary-600/10 rounded-xl text-primary-400"><Users size={24} /></div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">System Nodes</p>
                <h3 className="text-2xl font-bold text-white mt-1">{stats.total_users}</h3>
              </div>
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-[#1e293b] flex items-center gap-5">
              <div className="p-3.5 bg-green-500/10 rounded-xl text-green-400"><Layers size={24} /></div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Batches</p>
                <h3 className="text-2xl font-bold text-white mt-1">{stats.total_batches}</h3>
              </div>
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-[#1e293b] flex items-center gap-5">
              <div className="p-3.5 bg-accent-500/10 rounded-xl text-accent-400"><AlertCircle size={24} /></div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Recalls</p>
                <h3 className="text-2xl font-bold text-white mt-1 text-accent-400">{stats.active_recalls}</h3>
              </div>
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-[#1e293b] flex items-center gap-5">
              <div className="p-3.5 bg-yellow-500/10 rounded-xl text-yellow-400"><TrendingUp size={24} /></div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Anomaly Rate</p>
                <h3 className="text-2xl font-bold text-yellow-400 mt-1">{stats.anomaly_rate}%</h3>
              </div>
            </div>
          </div>

          {/* Pending Approval Table */}
          {pendingUsers.length > 0 && (
            <div className="rounded-2xl glass-panel border border-yellow-500/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#1e293b] bg-yellow-950/5 flex items-center gap-3">
                <ShieldAlert className="text-yellow-500" size={18} />
                <h2 className="font-bold text-white">Pending Partner Profile Approvals</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-[#151c2c] text-xs font-semibold text-gray-300 uppercase tracking-wider border-b border-[#1e293b]">
                    <tr>
                      <th className="px-6 py-3.5">Full Name</th>
                      <th className="px-6 py-3.5">Requested Role</th>
                      <th className="px-6 py-3.5">Organization</th>
                      <th className="px-6 py-3.5">Email</th>
                      <th className="px-6 py-3.5 text-right">Verification Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {pendingUsers.map((p) => (
                      <tr key={p._id} className="hover:bg-[#151c2c]/40">
                        <td className="px-6 py-4 font-semibold text-white">{p.full_name}</td>
                        <td className="px-6 py-4">{p.role}</td>
                        <td className="px-6 py-4">{p.organization}</td>
                        <td className="px-6 py-4">{p.email}</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(p._id, true)}
                            disabled={actionLoading}
                            className="p-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/20 active:bg-green-500/30"
                            title="Approve Node"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleApprove(p._id, false)}
                            disabled={actionLoading}
                            className="p-1.5 bg-accent-500/10 border border-accent-500/30 rounded-lg text-accent-400 hover:bg-accent-500/20 active:bg-accent-500/30"
                            title="Reject Node"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* 3. MANUFACTURER VIEW */}
      {user.role === 'Manufacturer' && (
        <div className="rounded-2xl glass-panel border border-[#1e293b] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1e293b] flex justify-between items-center bg-[#151c2c]/30">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-primary-400" />
              Registered Manufacturing Batches
            </h2>
            <Link to="/batches" className="text-xs font-semibold px-3 py-1.5 bg-primary-505 hover:bg-primary-600 text-white rounded-lg transition-colors">
              + New Batch
            </Link>
          </div>
          {batches.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No batches registered. Click "+ New Batch" to serialize inventory.</div>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {batches.map((b) => (
                    <tr key={b._id} className="hover:bg-[#151c2c]/20">
                      <td className="px-6 py-4 font-semibold text-white">
                        <Link to={`/batches/${b.batch_number}`} className="hover:underline text-primary-400 flex items-center gap-1.5">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. DISTRIBUTOR / PHARMACY VIEW */}
      {['Distributor', 'Pharmacy'].includes(user.role) && (
        <div className="rounded-2xl glass-panel border border-[#1e293b] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1e293b] flex justify-between items-center bg-[#151c2c]/30">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Clock size={18} className="text-primary-400" />
              Incoming and Outgoing Cargo Shipments
            </h2>
            <Link to="/logistics" className="text-xs font-semibold px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
              Cargo Dispatch Portal
            </Link>
          </div>
          {shipments.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No shipments logged. Access the Cargo Dispatch Portal to execute routes.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-[#151c2c] text-xs font-semibold text-gray-300 border-b border-[#1e293b] uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Shipment ID</th>
                    <th className="px-6 py-3.5">Batch</th>
                    <th className="px-6 py-3.5">Serialized Items</th>
                    <th className="px-6 py-3.5">Created</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {shipments.map((s) => (
                    <tr key={s._id} className="hover:bg-[#151c2c]/20">
                      <td className="px-6 py-4 font-semibold text-white">{s.shipment_id}</td>
                      <td className="px-6 py-4">{s.batch_number}</td>
                      <td className="px-6 py-4">{s.serial_numbers.length} units</td>
                      <td className="px-6 py-4">{s.created_at.split('T')[0]}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          s.status === 'Delivered'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : s.status === 'In Transit'
                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 pulse-indicator'
                            : 'bg-accent-500/10 text-accent-400 border-accent-500/20'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Activity Logs (Dynamic Theme Toggled) */}
      {isConsumer ? (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden mt-6">
          {/* Table Panel Header */}
          <div className="px-6 py-5 border-b border-slate-100 bg-white">
            <h2 className="font-bold text-slate-800 flex items-center gap-2.5 text-base">
              <Award size={18} className="text-blue-600" />
              Audit ledger updates (Activity Log)
            </h2>
          </div>

          {/* Table Content */}
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No activity logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f8fafc] text-[11px] font-extrabold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Operator</th>
                    <th className="px-6 py-4">Action Code</th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-xs">
                  {filteredLogs.slice(0, 10).map((l) => (
                    <tr key={l._id} className="hover:bg-slate-50/50 transition-colors bg-white">
                      <td className="px-6 py-4 font-bold text-slate-800">{l.username} ({l.role})</td>
                      <td className="px-6 py-4">
                        <span className={getActionChipClass(l.action)}>{l.action}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-sm truncate">{l.details}</td>
                      <td className="px-6 py-4 text-right text-slate-500 font-medium">
                        {new Date(l.timestamp).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl glass-panel border border-[#1e293b] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1e293b] bg-[#151c2c]/10">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Award size={18} className="text-primary-400" />
              Audit ledger updates (Activity Log)
            </h2>
          </div>
          {activityLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No activities logged yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-[#151c2c] text-xs font-semibold text-gray-300 border-b border-[#1e293b] uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Operator</th>
                    <th className="px-6 py-3.5">Action Code</th>
                    <th className="px-6 py-3.5">Details</th>
                    <th className="px-6 py-3.5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b] font-mono text-xs">
                  {activityLogs.slice(0, 10).map((l) => (
                    <tr key={l._id} className="hover:bg-[#151c2c]/20">
                      <td className="px-6 py-3 font-semibold text-white">{l.username} ({l.role})</td>
                      <td className="px-6 py-3 text-primary-400">{l.action}</td>
                      <td className="px-6 py-3 text-gray-300 max-w-sm truncate">{l.details}</td>
                      <td className="px-6 py-3 text-right text-gray-500">{new Date(l.timestamp).toLocaleString()}</td>
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

export default Dashboard;
