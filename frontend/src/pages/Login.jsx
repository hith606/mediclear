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
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-800 relative select-none">
      
      {/* Header Bar */}
      <header className="h-16 border-b border-gray-200 px-6 flex items-center justify-between bg-white z-20">
        <div className="flex items-center gap-2">
          <Shield className="text-blue-600 fill-blue-600/10" size={22} />
          <span className="font-bold text-lg text-blue-900 tracking-tight">Medicare Enterprise</span>
        </div>
        <div className="flex items-center gap-4 text-gray-500">
          <button type="button" className="hover:text-blue-600 transition-colors"><Shield size={18} /></button>
          <button type="button" className="hover:text-blue-600 transition-colors"><HelpCircle size={18} /></button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Left Panel: Clinical Branding Info */}
        <div className="w-full md:w-1/2 bg-[#f0f3ff] p-8 md:p-16 flex flex-col justify-between items-center text-center">
          <div className="hidden md:block" />
          
          <div className="max-w-md space-y-6 my-auto flex flex-col items-center">
            {/* Blue microscope logo box */}
            <div className="p-5 bg-blue-100 rounded-2xl text-blue-600 flex items-center justify-center w-20 h-20 shadow-sm border border-blue-200/50">
              <Microscope size={40} />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-blue-950 tracking-tight leading-tight whitespace-pre-line">
              {"Medicare:\nLogin Portal"}
            </h1>
            
            <p className="text-sm md:text-base text-gray-600 leading-relaxed font-normal">
              Access the PharmaTrack Enterprise portal to manage clinical trial data with SOC 2 Type II compliance and end-to-end encryption.
            </p>
          </div>

          {/* Compliance features badges list */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <div className="flex flex-col items-center gap-1.5">
              <div className="p-2 bg-white rounded-lg border border-gray-200 text-green-500 shadow-sm">
                <ShieldCheck size={18} />
              </div>
              <span className="text-[9px] font-bold text-gray-500 tracking-wider uppercase">FDA COMPLIANT</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="p-2 bg-white rounded-lg border border-gray-200 text-blue-500 shadow-sm">
                <Shield size={18} />
              </div>
              <span className="text-[9px] font-bold text-gray-500 tracking-wider uppercase">SOC 2 TYPE II</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="p-2 bg-white rounded-lg border border-gray-200 text-blue-600 shadow-sm">
                <Lock size={18} />
              </div>
              <span className="text-[9px] font-bold text-gray-500 tracking-wider uppercase">E2E ENCRYPTED</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Secure Authenticator Form */}
        <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8 md:p-16">
          <div className="w-full max-w-md border border-gray-200 rounded-2xl p-8 bg-white shadow-sm hover:shadow-md transition-all duration-200">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Secure Access</h2>
              <p className="text-xs text-gray-500 mt-1">Please authenticate to continue to the portal.</p>
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
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Username or Node ID</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-gray-400"><User size={16} /></span>
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter ID"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Authentication Key</label>
                  <Link to="/reset-password" className="text-xs font-semibold text-blue-600 hover:text-blue-800">Forgot Key?</Link>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-gray-400"><Key size={16} /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
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
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="remember" className="text-xs text-gray-500 font-medium select-none cursor-pointer">
                  Remember this device
                </label>
              </div>

              {/* Submit Secure Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Secure Sign In'}
                <ArrowRight size={14} />
              </button>
            </form>

            {/* Terms and Disclaimer */}
            <p className="text-[10px] text-center text-gray-500 mt-6 leading-relaxed">
              By signing in, you agree to the <a href="#" className="text-blue-600 hover:underline">Compliance Standards</a> & <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>.
            </p>

            {/* Account Registration Link */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500 font-medium">
                First time in the supply chain network?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-800 font-bold hover:underline">
                  Create an Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <footer className="h-14 border-t border-gray-200 px-6 flex flex-col md:flex-row items-center justify-between bg-white text-gray-500 text-[10px] md:text-xs z-20 py-4 gap-2">
        <div>
          © 2026 Medicare Systems. All rights reserved. Clinical Data Integrity Verified.
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Compliance Standards</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Contact Support</a>
        </div>
      </footer>
    </div>
  );
};

export default Login;
