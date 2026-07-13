import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  ShieldCheck, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Microscope, 
  Shield, 
  Key, 
  ArrowRight, 
  HelpCircle 
} from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show success alerts from registration redirect
    if (location.state?.registered) {
      const role = location.state.role;
      if (role === 'Consumer' || role === 'Regulatory Authority') {
        setSuccess('Registration successful! Please log in.');
      } else {
        setSuccess(`Registration submitted! Your profile as a ${role} is pending approval from the Regulatory Authority.`);
      }
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.auth.login(formData);
      const data = response.data;
      
      localStorage.setItem('token', data.access_token);
      
      // Get detailed user profile immediately to sync local user state
      const profileResponse = await api.auth.getMe();
      localStorage.setItem('user', JSON.stringify(profileResponse.data));

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Incorrect username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fc] flex flex-col font-sans text-gray-800 select-none">
      
      {/* Header Bar */}
      <header className="h-16 border-b border-slate-200/80 px-12 flex items-center justify-between bg-white z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2">
          <Shield className="text-blue-600 fill-blue-600/10" size={22} />
          <span className="font-extrabold text-base text-blue-600 tracking-wide font-sans">Medicare Supply Chain</span>
        </div>
        <div>
          <Link 
            to="/register" 
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-all shadow-sm shadow-blue-500/10"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-lg p-8 rounded-2xl border border-slate-200/80 bg-white shadow-sm relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-blue-600 rounded-2xl text-white mb-3 shadow-md shadow-blue-500/20">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 font-sans">Secure Access</h1>
            <p className="text-sm text-slate-500 mt-1">Please authenticate to continue to the portal</p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-medium leading-relaxed">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Username or Node ID</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400"><User size={16} /></span>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter ID"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Authentication Key</label>
                <Link to="/reset-password" className="text-xs font-semibold text-blue-600 hover:text-blue-800">Forgot Key?</Link>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400"><Lock size={16} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Checkbox Option */}
            <div className="flex items-center gap-2 py-1.5">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-slate-500 font-medium select-none cursor-pointer">
                Remember this device
              </label>
            </div>

            {/* Submit Secure Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50 shadow-md shadow-blue-500/10"
            >
              {loading ? 'Authenticating...' : 'Secure Sign In'}
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Account Registration Link */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-medium">
              First time in the supply chain network?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-800 font-bold hover:underline">
                Create an Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <footer className="border-t border-slate-200/80 px-12 flex flex-col md:flex-row items-center justify-between bg-white text-slate-500 text-xs py-4 gap-2 z-20">
        <div>
          © 2024 Medicare Pharmaceutical Supply Chain Network. All rights reserved. Secure Enterprise Portal.
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Security Protocols</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Accessibility</a>
        </div>
      </footer>
    </div>
  );
};

export default Login;
