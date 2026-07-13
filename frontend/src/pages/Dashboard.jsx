import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Users, Layers, AlertCircle, TrendingUp, Check, X,
  Clock, ShieldAlert, Award, FileText, Download, QrCode
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

  // Dynamic Body Styling for public light theme dashboard
  useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    const originalColor = document.body.style.color;
    const originalClass = document.body.className;

    document.body.style.backgroundColor = '#f8fafc';
    document.body.style.color = '#1e293b';
    document.body.className = 'bg-[#f8fafc] text-slate-800 font-sans';

    return () => {
      document.body.style.backgroundColor = originalBg;
      document.body.style.color = originalColor;
      document.body.className = originalClass;
    };
  }, []);

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
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 1. Pending Approval Lobby View
  if (user.role !== 'Consumer' && user.role !== 'Regulatory Authority' && user.status === 'Pending Approval') {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-white border border-gray-150 rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.02)] text-center animate-fade-in">
        <div className="inline-flex p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-600 mb-6">
          <Clock size={40} className="animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 font-sans">Verification in Progress</h1>
        <p className="text-sm text-slate-500 mt-3 leading-relaxed">
          Welcome to the MediClear network, <strong className="text-slate-800">{user.full_name}</strong>. 
          Your request to operate as a verified <strong className="text-slate-800">{user.role}</strong> node has been received 
          and is currently queued in the national approval registry.
        </p>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 my-6 text-left space-y-2">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Node Registry Parameters:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="text-slate-500">Node Operator:</span><span className="text-slate-800 text-right font-medium">{user.username}</span>
            <span className="text-slate-500">Organization:</span><span className="text-slate-800 text-right font-medium">{user.organization}</span>
            <span className="text-slate-500">Email Address:</span><span className="text-slate-800 text-right font-medium">{user.email}</span>
            <span className="text-slate-500">Approval Status:</span><span className="text-amber-600 text-right font-semibold">{user.status}</span>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          We will contact you via email once the compliance review is finalized. Standard clearance time takes 1-2 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 font-sans tracking-tight">Operational Control Panel</h1>
        <p className="text-sm text-slate-500 mt-1">Hello, {user.full_name} ({user.role}) • Node status active.</p>
      </div>

      {/* 2. REGULATOR VIEW */}
      {user.role === 'Regulatory Authority' && stats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex items-center gap-5 hover:shadow-md transition-shadow duration-200">
              <div className="p-3.5 bg-blue-50 rounded-xl text-blue-600"><Users size={24} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Nodes</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.total_users}</h3>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex items-center gap-5 hover:shadow-md transition-shadow duration-200">
              <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600"><Layers size={24} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Batches</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.total_batches}</h3>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex items-center gap-5 hover:shadow-md transition-shadow duration-200">
              <div className="p-3.5 bg-red-50 rounded-xl text-red-600"><AlertCircle size={24} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Recalls</p>
                <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.active_recalls}</h3>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex items-center gap-5 hover:shadow-md transition-shadow duration-200">
              <div className="p-3.5 bg-amber-50 rounded-xl text-amber-600"><TrendingUp size={24} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Anomaly Rate</p>
                <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.anomaly_rate}%</h3>
              </div>
            </div>
          </div>

          {/* Pending Approval Table */}
          {pendingUsers.length > 0 && (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                <ShieldAlert className="text-amber-600" size={18} />
                <h2 className="font-semibold text-slate-800">Pending Partner Profile Approvals</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3.5">Full Name</th>
                      <th className="px-6 py-3.5">Requested Role</th>
                      <th className="px-6 py-3.5">Organization</th>
                      <th className="px-6 py-3.5">Email</th>
                      <th className="px-6 py-3.5 text-right">Verification Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingUsers.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-semibold text-slate-800">{p.full_name}</td>
                        <td className="px-6 py-4">{p.role}</td>
                        <td className="px-6 py-4">{p.organization}</td>
                        <td className="px-6 py-4">{p.email}</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(p._id, true)}
                            disabled={actionLoading}
                            className="p-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 hover:bg-emerald-100 active:bg-emerald-200 cursor-pointer"
                            title="Approve Node"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleApprove(p._id, false)}
                            disabled={actionLoading}
                            className="p-1.5 bg-red-50 border border-red-100 rounded-lg text-red-600 hover:bg-red-100 active:bg-red-200 cursor-pointer"
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
        <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Layers size={18} className="text-blue-500" />
              Registered Manufacturing Batches
            </h2>
            <Link to="/batches" className="text-xs font-semibold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer">
              + New Batch
            </Link>
          </div>
          {batches.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No batches registered. Click "+ New Batch" to serialize inventory.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/50 text-xs font-semibold text-slate-500 border-b border-slate-100 uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Batch Number</th>
                    <th className="px-6 py-3.5">Drug SKU</th>
                    <th className="px-6 py-3.5">Units</th>
                    <th className="px-6 py-3.5">Mfg Date</th>
                    <th className="px-6 py-3.5">Expiry Date</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        <Link to={`/batches/${b.batch_number}`} className="hover:underline text-blue-600 flex items-center gap-1.5 font-mono">
                          <QrCode size={14} />
                          {b.batch_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{b.medicine_sku}</td>
                      <td className="px-6 py-4">{b.quantity}</td>
                      <td className="px-6 py-4">{b.manufacture_date.split('T')[0]}</td>
                      <td className="px-6 py-4">{b.expiry_date.split('T')[0]}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          b.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-red-50 text-red-700 border-red-100'
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
        <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              Incoming and Outgoing Cargo Shipments
            </h2>
            <Link to="/logistics" className="text-xs font-semibold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer">
              Cargo Dispatch Portal
            </Link>
          </div>
          {shipments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No shipments logged. Access the Cargo Dispatch Portal to execute routes.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/50 text-xs font-semibold text-slate-500 border-b border-slate-100 uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Shipment ID</th>
                    <th className="px-6 py-3.5">Batch</th>
                    <th className="px-6 py-3.5">Serialized Items</th>
                    <th className="px-6 py-3.5">Created</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shipments.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-semibold text-slate-800 font-mono text-xs">{s.shipment_id}</td>
                      <td className="px-6 py-4 font-mono text-xs">{s.batch_number}</td>
                      <td className="px-6 py-4">{s.serial_numbers.length} units</td>
                      <td className="px-6 py-4">{s.created_at.split('T')[0]}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          s.status === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : s.status === 'In Transit'
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : 'bg-red-50 text-red-700 border-red-100'
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

      {/* Activity Logs (Always Visible) */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Award size={18} className="text-blue-500" />
            Audit Ledger Updates (Activity Log)
          </h2>
        </div>
        {activityLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No activities logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/50 text-xs font-semibold text-slate-500 border-b border-slate-100 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Operator</th>
                  <th className="px-6 py-3.5">Action Code</th>
                  <th className="px-6 py-3.5">Details</th>
                  <th className="px-6 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {activityLogs.slice(0, 10).map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-semibold text-slate-800">{l.username} ({l.role})</td>
                    <td className="px-6 py-3 text-blue-600 font-semibold">{l.action}</td>
                    <td className="px-6 py-3 text-slate-600 max-w-sm truncate">{l.details}</td>
                    <td className="px-6 py-3 text-right text-slate-400">{new Date(l.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
