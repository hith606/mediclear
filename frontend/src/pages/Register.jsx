import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ShieldCheck, User, Mail, Building, Phone, Lock, Eye, EyeOff } from 'lucide-react';

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
    <div className="flex items-center justify-center min-h-screen bg-[#0b0f19] px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/25 via-[#0b0f19] to-[#0b0f19] pointer-events-none" />
      
      <div className="w-full max-w-lg p-8 rounded-2xl glass-panel border border-[#1e293b] glow-blue relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary-600/10 border border-primary-500/20 rounded-2xl text-primary-500 mb-3">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white font-sans">Create Account</h1>
          <p className="text-sm text-gray-400 mt-1">Join the MediClear Supply Chain Network</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-accent-900/25 border border-accent-500/30 text-accent-400 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500"><User size={16} /></span>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g. janesmith"
                  className="w-full pl-10 pr-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500"><Mail size={16} /></span>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. jane@company.com"
                  className="w-full pl-10 pr-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500"><User size={16} /></span>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Jane Smith"
                  className="w-full pl-10 pr-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            {/* Role Select */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Network Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors"
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
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Organization / Firm</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500"><Building size={16} /></span>
                  <input
                    type="text"
                    name="organization"
                    required
                    value={formData.organization}
                    onChange={handleChange}
                    placeholder="e.g. Apex Pharma Inc"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500"><Phone size={16} /></span>
                  <input
                    type="text"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="e.g. +14155552671"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Secret Password</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500"><Lock size={16} /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {formData.role !== 'Consumer' && formData.role !== 'Regulatory Authority' && (
            <div className="text-[10px] text-yellow-500/80 bg-yellow-950/20 border border-yellow-800/10 p-3 rounded-lg leading-relaxed">
              ⚠️ Note: As a B2B partner ({formData.role}), your profile requires manual verification and sign-off by the National Regulatory Authority before logistics nodes are accessible.
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all duration-150 transform hover:-translate-y-[1px] disabled:opacity-50 disabled:transform-none mt-2"
          >
            {loading ? 'Creating Profile...' : 'Complete Registration'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Already registered?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
