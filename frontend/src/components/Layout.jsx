import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, LayoutDashboard, Database, QrCode, 
  Truck, HelpCircle, FileText, AlertTriangle, 
  User, LogOut, CheckSquare, Sparkles, Image, Compass
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

  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0f19]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-[#1e293b] flex-shrink-0">
        {/* Sidebar Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1e293b]">
          <div className="p-2 bg-primary-600/10 border border-primary-500/30 rounded-lg text-primary-500">
            <ShieldCheck size={24} className="pulse-indicator" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-sans text-white tracking-tight leading-none">MediClear</h1>
            <span className="text-[10px] text-gray-400 font-sans uppercase tracking-wider font-semibold">Supply Integrity</span>
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
                    ? 'bg-primary-600/10 text-primary-400 border border-primary-500/20'
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
        <div className="p-4 border-t border-[#1e293b] space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#1e293b] text-primary-400 border border-gray-700">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-xs font-semibold text-accent-400 hover:bg-accent-600/10 border border-transparent rounded-lg hover:border-accent-500/15 transition-all"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-6 py-4 glass-panel border-b border-[#1e293b]">
          <div className="flex items-center gap-3 md:hidden">
            <ShieldCheck size={28} className="text-primary-500" />
            <span className="font-bold text-white text-lg">MediClear</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
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
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs font-medium text-gray-400">Identity:</span>
              <span className="text-xs font-semibold text-white ml-1.5">{user.username}</span>
            </div>
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
