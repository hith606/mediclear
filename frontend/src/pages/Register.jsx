import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Shield, ShieldCheck, User, Mail, Building, Phone, Lock, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Consumer', // Default role
    full_name: '',
    organization: '',
    phone_number: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.auth.register(formData);
      // Automatically redirect to login
      navigate('/login', { state: { registered: true, role: formData.role } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please check inputs.');
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
            to="/login" 
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-all shadow-sm shadow-blue-500/10"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-lg p-8 rounded-2xl border border-slate-200/80 bg-white shadow-sm relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-blue-600 rounded-2xl text-white mb-3 shadow-md shadow-blue-500/20">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 font-sans">Create Account</h1>
            <p className="text-sm text-slate-500 mt-1">Join the MediClear Supply Chain Network</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Username</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400"><User size={16} /></span>
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="e.g. janesmith"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400"><Mail size={16} /></span>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. jane@company.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400"><User size={16} /></span>
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Jane Smith"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                  />
                </div>
              </div>

              {/* Role Select */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Network Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors cursor-pointer"
                >
                  <option value="Consumer">Consumer (General Public)</option>
                  <option value="Manufacturer">Manufacturer</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Regulatory Authority">Regulatory Authority</option>
                </select>
              </div>
            </div>

            {/* Conditional Org / Phone fields */}
            {formData.role !== 'Consumer' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Organization / Firm</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400"><Building size={16} /></span>
                    <input
                      type="text"
                      name="organization"
                      required
                      value={formData.organization}
                      onChange={handleChange}
                      placeholder="e.g. Apex Pharma Inc"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400"><Phone size={16} /></span>
                    <input
                      type="text"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="e.g. +14155552671"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Secret Password</label>
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

            {formData.role !== 'Consumer' && formData.role !== 'Regulatory Authority' && (
              <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-lg leading-relaxed shadow-sm">
                ⚠️ Note: As a B2B partner ({formData.role}), your profile requires manual verification and sign-off by the National Regulatory Authority before logistics nodes are accessible.
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50 shadow-md shadow-blue-500/10 mt-2"
            >
              {loading ? 'Creating Profile...' : 'Complete Registration'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Already registered?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <footer className="border-t border-slate-200/80 px-12 flex flex-col md:flex-row items-center justify-between bg-white text-slate-500 text-xs py-4 gap-2 z-20">
        <div>
          © 2026 Medicare Pharmaceutical Supply Chain Network. All rights reserved. Secure Enterprise Portal.
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

export default Register;
