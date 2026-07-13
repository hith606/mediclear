import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, LayoutDashboard, Database, QrCode, 
  Truck, HelpCircle, FileText, AlertTriangle, 
  User, LogOut, CheckSquare, Sparkles, Image, Compass,
  Bell, Radio, Settings, Network
} from 'lucide-react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      setUser(JSON.parse(userString));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  const role = user.role;
  const isApproved = user.status === 'Approved' || role === 'Regulatory Authority' || role === 'Consumer';
  const isConsumer = role === 'Consumer';

  // Navigation Links based on Roles
  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: LayoutDashboard, 
      roles: ['Manufacturer', 'Distributor', 'Pharmacy', 'Regulatory Authority', 'Consumer'] 
    },
    { 
      name: 'Register Medicine', 
      path: '/batches', 
      icon: QrCode, 
      roles: ['Manufacturer'] 
    },
    { 
      name: 'Custody & Logistics', 
      path: '/logistics', 
      icon: Truck, 
      roles: ['Manufacturer', 'Distributor', 'Pharmacy'] 
    },
    { 
      name: 'OpenCV Authenticator', 
      path: '/image-verification', 
      icon: Image, 
      roles: ['Pharmacy', 'Regulatory Authority'] 
    },
    { 
      name: 'Regulatory Board', 
      path: '/regulatory', 
      icon: ShieldCheck, 
      roles: ['Regulatory Authority'] 
    },
    { 
      name: 'AI Anomaly Center', 
      path: '/ai-anomalies', 
      icon: Sparkles, 
      roles: ['Regulatory Authority'] 
    },
    { 
      name: 'Verify Medicine', 
      path: '/verify', 
      icon: Compass, 
      roles: ['Consumer', 'Manufacturer', 'Distributor', 'Pharmacy', 'Regulatory Authority'] 
    }
  ];

  // Custom nav items for consumer theme
  const consumerNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Verification', path: '/verify', icon: ShieldCheck }
  ];

  const filteredNavItems = isConsumer 
    ? consumerNavItems 
    : navItems.filter(item => item.roles.includes(role));  return (
    <div className={`flex h-screen overflow-hidden ${isConsumer ? 'bg-[#f4f6fc]' : 'bg-[#0b0f19]'}`}>
      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col w-64 flex-shrink-0 ${
        isConsumer 
          ? 'bg-white border-r border-slate-200/80' 
          : 'glass-panel border-r border-[#1e293b]'
      }`}>
        {/* Sidebar Header */}
        <div className={`flex items-center gap-3 px-6 py-5 border-b ${
          isConsumer ? 'border-slate-100' : 'border-[#1e293b]'
        }`}>
          {isConsumer ? (
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-sm shadow-blue-500/20">
              <ShieldCheck size={20} />
            </div>
          ) : (
            <div className="p-2 bg-primary-600/10 border border-primary-500/30 rounded-lg text-primary-500">
              <ShieldCheck size={24} className="pulse-indicator" />
            </div>
          )}
          <div>
            <h1 className={`text-base font-extrabold font-sans tracking-tight leading-none ${
              isConsumer ? 'text-blue-600' : 'text-white'
            }`}>
              {isConsumer ? 'Medicare' : 'MediClear'}
            </h1>
            <span className={`text-[10px] font-sans uppercase tracking-wider font-bold block mt-1 ${
              isConsumer ? 'text-slate-500' : 'text-gray-400'
            }`}>
              {isConsumer ? 'SUPPLY CHAIN ADMIN' : 'Supply Integrity'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isDisabled = !isApproved && item.path !== '/dashboard' && item.path !== '/verify';

            if (isDisabled) return null;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-150 ${
                  isActive
                    ? isConsumer
                      ? 'bg-blue-50/70 text-[#1e52d3] border-r-4 border-[#1e52d3] rounded-r-none font-semibold'
                      : 'bg-primary-600/10 text-primary-400 border border-primary-500/20'
                    : isConsumer
                      ? 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800 border border-transparent'
                      : 'text-gray-400 hover:bg-[#151c2c] hover:text-gray-200 border border-transparent'
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t ${isConsumer ? 'border-slate-100' : 'border-[#1e293b]'} space-y-3`}>
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
            isConsumer ? 'bg-slate-50 border border-slate-100' : ''
          }`}>
            {isConsumer ? (
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex-shrink-0">
                <User size={18} />
              </div>
            ) : (
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#1e293b] text-primary-400 border border-gray-700">
                <User size={16} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold truncate ${isConsumer ? 'text-slate-800' : 'text-white'}`}>{user.full_name}</p>
              <p className={`text-[10px] font-medium truncate ${isConsumer ? 'text-slate-500' : 'text-gray-400'}`}>Admin</p>
              {isConsumer && <p className="text-[10px] text-slate-500 font-medium truncate">({user.role})</p>}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`flex items-center justify-center gap-2.5 w-full px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
              isConsumer 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60' 
                : 'text-accent-400 hover:bg-accent-600/10 border border-transparent rounded-lg hover:border-accent-500/15'
            }`}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navbar */}
        <header className={`flex items-center justify-between px-6 py-4 border-b ${
          isConsumer 
            ? 'bg-white border-slate-200/80' 
            : 'glass-panel border-[#1e293b]'
        }`}>
          <div className="flex items-center gap-3 md:hidden">
            <ShieldCheck size={28} className={isConsumer ? 'text-blue-600' : 'text-primary-500'} />
            <span className={`font-bold text-lg ${isConsumer ? 'text-slate-800' : 'text-white'}`}>
              {isConsumer ? 'Medicare' : 'MediClear'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isConsumer ? (
              <>
                <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-white text-slate-700 border border-slate-200 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  Environment: Sandbox Dev
                </span>
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Node Active & Verified
                </span>

              </>
            ) : (
              <>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Environment: Sandbox Dev
                </span>
                {isApproved ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                    Node Active & Verified
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                    Awaiting Regulatory Clearance
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isConsumer ? (
              <div className="flex items-center gap-4">
                <button className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                  <Bell size={18} />
                </button>
                <div className="h-6 w-px bg-slate-200"></div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors shadow-sm shadow-blue-500/10">
                  Emergency Restock
                </button>
              </div>
            ) : (
              <div className="text-right">
                <span className="text-xs font-medium text-gray-400">Identity:</span>
                <span className="text-xs font-semibold text-white ml-1.5">{user.username}</span>
              </div>
            )}
          </div>
        </header>

        {/* Dashboard Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
