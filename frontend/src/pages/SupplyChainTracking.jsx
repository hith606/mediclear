import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Truck, ArrowRight, CheckCircle, Navigation, MapPin, 
  Map, Clock, Info, ShieldCheck, ChevronDown, ChevronUp
} from 'lucide-react';

const SupplyChainTracking = () => {
  const [user, setUser] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [partners, setPartners] = useState([]);
  const [batches, setBatches] = useState([]);
  
  // Tab control
  const [activeTab, setActiveTab] = useState('active-shipments');
  const [selectedShipment, setSelectedShipment] = useState(null);

  // New Shipment Form State
  const [shipmentForm, setShipmentForm] = useState({
    batch_number: '',
    receiver_id: '',
    serial_numbers: '',
    location: '',
    lat: 19.0760,
    lng: 72.8777
  });

  // Transit Update Form State
  const [transitUpdate, setTransitUpdate] = useState({
    location: '',
    lat: 22.5726,
    lng: 88.3639
  });

  // Receive Cargo Form State
  const [receiveForm, setReceiveForm] = useState({
    location: '',
    lat: 28.7041,
    lng: 77.1025
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) return;
      const loggedUser = JSON.parse(userString);
      setUser(loggedUser);

      // Fetch Shipments
      const shipRes = await api.tracking.getShipments();
      setShipments(shipRes.data);

      // Fetch recipient directory
      let targetRole = '';
      if (loggedUser.role === 'Manufacturer') targetRole = 'Distributor';
      else if (loggedUser.role === 'Distributor') targetRole = 'Pharmacy';

      if (targetRole) {
        const partnerRes = await api.auth.getPartners(targetRole);
        setPartners(partnerRes.data);
        if (partnerRes.data.length > 0) {
          setShipmentForm(prev => ({ ...prev, receiver_id: partnerRes.data[0]._id }));
        }
      }

      // Fetch Batches to select from
      const batchRes = await api.medicine.getBatches();
      setBatches(batchRes.data);
      if (batchRes.data.length > 0) {
        setShipmentForm(prev => ({ ...prev, batch_number: batchRes.data[0].batch_number }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);

    try {
      // Split serials by comma or newline
      const serialsList = shipmentForm.serial_numbers
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      if (serialsList.length === 0) {
        throw new Error("You must enter at least one serial number.");
      }

      await api.tracking.createShipment({
        batch_number: shipmentForm.batch_number,
        receiver_id: shipmentForm.receiver_id,
        serial_numbers: serialsList,
        location: shipmentForm.location,
        coordinates: {
          lat: parseFloat(shipmentForm.lat),
          lng: parseFloat(shipmentForm.lng)
        }
      });

      setSuccess('Shipment initiated successfully! Serial logs updated to In Transit.');
      setShipmentForm(prev => ({ ...prev, serial_numbers: '', location: '' }));
      setActiveTab('active-shipments');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to dispatch shipment.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransitUpdate = async (shipmentId) => {
    setError(''); setSuccess(''); setLoading(true);
    try {
      await api.tracking.updateLocation(shipmentId, {
        location: transitUpdate.location,
        coordinates: {
          lat: parseFloat(transitUpdate.lat),
          lng: parseFloat(transitUpdate.lng)
        }
      });
      setSuccess('Transit coordinates updated on timeline!');
      setTransitUpdate({ location: '', lat: 22.5726, lng: 88.3639 });
      await loadData();
      // Update selected view
      const updatedShip = shipments.find(s => s.shipment_id === shipmentId);
      if (updatedShip) {
        // Fetch fresh list to update selected
        const freshRes = await api.tracking.getShipments();
        const freshSelected = freshRes.data.find(s => s.shipment_id === shipmentId);
        setSelectedShipment(freshSelected);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to post transit update.');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveShipment = async (shipmentId) => {
    setError(''); setSuccess(''); setLoading(true);
    try {
      await api.tracking.receiveShipment(shipmentId, {
        location: receiveForm.location,
        coordinates: {
          lat: parseFloat(receiveForm.lat),
          lng: parseFloat(receiveForm.lng)
        }
      });
      setSuccess('Cargo custody received and registered successfully!');
      setReceiveForm({ location: '', lat: 28.7041, lng: 77.1025 });
      await loadData();
      setSelectedShipment(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to receive shipment.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white font-sans">Cargo Handovers & Logistics Tracking</h1>
        <p className="text-sm text-gray-400 mt-1">Dispatches new shipments, tracks in-transit cargo coordinates, and logs custody transfer receipts.</p>
      </div>

      {/* Alerts */}
      {success && <div className="p-4 bg-green-950/25 border border-green-500/30 text-green-400 rounded-xl text-xs font-semibold">{success}</div>}
      {error && <div className="p-4 bg-accent-900/25 border border-accent-500/30 text-accent-400 rounded-xl text-xs font-semibold">{error}</div>}

      {/* Tabs */}
      <div className="flex border-b border-[#1e293b] gap-2">
        <button
          onClick={() => { setActiveTab('active-shipments'); setSelectedShipment(null); }}
          className={`pb-4 px-4 text-sm font-semibold transition-all ${activeTab === 'active-shipments' ? 'text-primary-400 border-b-2 border-primary-500' : 'text-gray-400 hover:text-gray-200'}`}
        >
          Active Log Ledger
        </button>
        {user.role !== 'Pharmacy' && (
          <button
            onClick={() => { setActiveTab('dispatch-cargo'); setSelectedShipment(null); }}
            className={`pb-4 px-4 text-sm font-semibold transition-all ${activeTab === 'dispatch-cargo' ? 'text-primary-400 border-b-2 border-primary-500' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Dispatch Cargo Shipments
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'active-shipments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipment Table */}
          <div className="lg:col-span-2 rounded-2xl glass-panel border border-[#1e293b] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1e293b] bg-[#151c2c]/10">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Truck size={18} className="text-primary-400" />
                Transit Ledger History
              </h2>
            </div>
            {shipments.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No shipments logged.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-[#151c2c] text-xs font-semibold text-gray-300 border-b border-[#1e293b] uppercase">
                    <tr>
                      <th className="px-6 py-3.5">Shipment ID</th>
                      <th className="px-6 py-3.5">Batch</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Route Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {shipments.map((s) => (
                      <tr key={s._id} className={`hover:bg-[#151c2c]/20 ${selectedShipment?.shipment_id === s.shipment_id ? 'bg-primary-950/10 border-l-2 border-primary-500' : ''}`}>
                        <td className="px-6 py-4 font-semibold text-white">{s.shipment_id}</td>
                        <td className="px-6 py-4 font-mono text-xs">{s.batch_number}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            s.status === 'Delivered'
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : s.status === 'In Transit'
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 pulse-indicator'
                              : 'bg-accent-500/10 text-accent-400 border-accent-500/20'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedShipment(s)}
                            className="text-xs text-primary-400 hover:text-primary-300 font-semibold"
                          >
                            Track Path
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Map/Timeline Tracker Sidebar */}
          <div className="p-6 rounded-2xl glass-panel border border-[#1e293b] space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Map size={18} className="text-primary-500" />
              Route Audit Tracker
            </h3>
            
            {selectedShipment ? (
              <div className="space-y-6">
                <div className="border-b border-[#1e293b] pb-4 space-y-2">
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Shipment Identification:</div>
                  <div className="text-sm font-bold text-white truncate">{selectedShipment.shipment_id}</div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-400">
                    <span>Batch Number:</span><span className="text-right text-white font-mono">{selectedShipment.batch_number}</span>
                    <span>Total Serials:</span><span className="text-right text-white font-mono">{selectedShipment.serial_numbers.length} units</span>
                  </div>
                </div>

                {/* Timeline display */}
                <div className="space-y-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Clock size={12} />
                    <span>Chain of Custody Timeline:</span>
                  </div>

                  <div className="relative border-l border-[#222f47] ml-2.5 pl-5 space-y-5 py-2">
                    {selectedShipment.timeline.map((event, idx) => (
                      <div key={idx} className="relative">
                        {/* Dot indicator */}
                        <span className={`absolute -left-[26px] top-1.5 w-3 h-3 rounded-full border-2 ${
                          event.action === 'Received' 
                            ? 'bg-green-500 border-[#0b0f19]' 
                            : event.action === 'Shipped' 
                            ? 'bg-primary-500 border-[#0b0f19]' 
                            : 'bg-yellow-500 border-[#0b0f19]'
                        }`} />
                        <div className="text-xs font-semibold text-white flex justify-between">
                          <span>{event.action}</span>
                          <span className="text-[9px] text-gray-500 font-normal">{new Date(event.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{event.actor_name} ({event.role})</div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-0.5 mt-0.5">
                          <MapPin size={10} />
                          <span>{event.location} {event.coordinates && `(${event.coordinates.lat.toFixed(4)}, ${event.coordinates.lng.toFixed(4)})`}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Receiver Actions */}
                {selectedShipment.status === 'In Transit' && selectedShipment.receiver_id === user._id && (
                  <div className="bg-[#151c2c] border border-gray-800 p-4 rounded-xl space-y-4">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-green-500" />
                      <span>Execute Custody Acceptance:</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase">Receipt Location Name</label>
                        <input
                          type="text" placeholder="e.g. Pharmacy Store Shelf, Delhi"
                          value={receiveForm.location}
                          onChange={e => setReceiveForm({...receiveForm, location: e.target.value})}
                          className="w-full px-3 py-1.5 text-xs bg-[#0b0f19] border border-[#222f47] rounded-lg text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase">Latitude</label>
                          <input
                            type="number" step="any"
                            value={receiveForm.lat}
                            onChange={e => setReceiveForm({...receiveForm, lat: parseFloat(e.target.value) || 0.0})}
                            className="w-full px-3 py-1.5 text-xs bg-[#0b0f19] border border-[#222f47] rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase">Longitude</label>
                          <input
                            type="number" step="any"
                            value={receiveForm.lng}
                            onChange={e => setReceiveForm({...receiveForm, lng: parseFloat(e.target.value) || 0.0})}
                            className="w-full px-3 py-1.5 text-xs bg-[#0b0f19] border border-[#222f47] rounded-lg text-white"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleReceiveShipment(selectedShipment.shipment_id)}
                        disabled={loading}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Accept Custody
                      </button>
                    </div>
                  </div>
                )}

                {/* Transit Updates (Sender Actions) */}
                {selectedShipment.status === 'In Transit' && selectedShipment.sender_id === user._id && (
                  <div className="bg-[#151c2c] border border-gray-800 p-4 rounded-xl space-y-4">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Navigation size={14} className="text-yellow-500" />
                      <span>Post Location Transit Log:</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase">Current Transit Point</label>
                        <input
                          type="text" placeholder="e.g. Nagpur Highway toll station"
                          value={transitUpdate.location}
                          onChange={e => setTransitUpdate({...transitUpdate, location: e.target.value})}
                          className="w-full px-3 py-1.5 text-xs bg-[#0b0f19] border border-[#222f47] rounded-lg text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase">Latitude</label>
                          <input
                            type="number" step="any"
                            value={transitUpdate.lat}
                            onChange={e => setTransitUpdate({...transitUpdate, lat: parseFloat(e.target.value) || 0.0})}
                            className="w-full px-3 py-1.5 text-xs bg-[#0b0f19] border border-[#222f47] rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase">Longitude</label>
                          <input
                            type="number" step="any"
                            value={transitUpdate.lng}
                            onChange={e => setTransitUpdate({...transitUpdate, lng: parseFloat(e.target.value) || 0.0})}
                            className="w-full px-3 py-1.5 text-xs bg-[#0b0f19] border border-[#222f47] rounded-lg text-white"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleTransitUpdate(selectedShipment.shipment_id)}
                        disabled={loading}
                        className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Publish Transit Update
                      </button>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 text-xs flex flex-col items-center gap-2">
                <Info size={16} />
                <span>Select a shipment from the ledger to view geographical path logs and perform transit actions.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'dispatch-cargo' && (
        <div className="p-6 max-w-2xl mx-auto rounded-2xl glass-panel border border-[#1e293b] space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Truck size={20} className="text-primary-500" />
            Dispatch Cargo Shipments
          </h2>
          {partners.length === 0 ? (
            <div className="p-4 bg-yellow-950/20 border border-yellow-800/20 rounded-xl text-yellow-500 text-xs">
              ⚠️ Logistics Halt: There are no verified, approved recipient nodes registered in your matching role channel.
            </div>
          ) : (
            <form onSubmit={handleCreateShipment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Select Production Batch</label>
                  <select
                    value={shipmentForm.batch_number}
                    onChange={e => setShipmentForm({...shipmentForm, batch_number: e.target.value})}
                    className="w-full px-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500"
                  >
                    {batches.map(b => <option key={b._id} value={b.batch_number}>{b.batch_number} ({b.medicine_sku})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Recipient Partner Node</label>
                  <select
                    value={shipmentForm.receiver_id}
                    onChange={e => setShipmentForm({...shipmentForm, receiver_id: e.target.value})}
                    className="w-full px-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500"
                  >
                    {partners.map(p => <option key={p._id} value={p._id}>{p.full_name} ({p.organization || 'N/A'})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Dispatch Location Name</label>
                <input
                  type="text" required placeholder="e.g. PharmaCorp Manufacturing Shed-1, Mumbai"
                  value={shipmentForm.location}
                  onChange={e => setShipmentForm({...shipmentForm, location: e.target.value})}
                  className="w-full px-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Latitude Coordinate</label>
                  <input
                    type="number" step="any" required
                    value={shipmentForm.lat}
                    onChange={e => setShipmentForm({...shipmentForm, lat: parseFloat(e.target.value) || 0.0})}
                    className="w-full px-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Longitude Coordinate</label>
                  <input
                    type="number" step="any" required
                    value={shipmentForm.lng}
                    onChange={e => setShipmentForm({...shipmentForm, lng: parseFloat(e.target.value) || 0.0})}
                    className="w-full px-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">
                  Units Serial Numbers (One per line or comma-separated)
                </label>
                <textarea
                  rows="5" required
                  placeholder="e.g.&#13;MC-SKU-ASP-500-B-ASP-001-0001&#13;MC-SKU-ASP-500-B-ASP-001-0002"
                  value={shipmentForm.serial_numbers}
                  onChange={e => setShipmentForm({...shipmentForm, serial_numbers: e.target.value})}
                  className="w-full px-4 py-2 text-xs bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none font-mono resize-none"
                />
                <span className="text-[10px] text-gray-500 leading-none mt-1.5 block">
                  Verify copy-pasted codes exactly match the serialization numbers registered in the batch.
                </span>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 font-semibold text-white text-sm rounded-xl transition-all"
              >
                {loading ? 'Processing dispatch order...' : 'Dispatch Shipment to Route'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default SupplyChainTracking;
