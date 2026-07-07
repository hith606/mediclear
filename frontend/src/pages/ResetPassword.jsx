import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ShieldCheck, User, Mail, Lock } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    new_password: '',
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.auth.resetPassword(formData);
      setSuccess('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed. Verify username and email match.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0b0f19] px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/25 via-[#0b0f19] to-[#0b0f19] pointer-events-none" />
      
      <div className="w-full max-w-md p-8 rounded-2xl glass-panel border border-[#1e293b] glow-blue relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary-600/10 border border-primary-500/20 rounded-2xl text-primary-500 mb-3">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white font-sans">Reset Password</h1>
          <p className="text-sm text-gray-400 mt-1">Configure fresh credentials for your node</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-950/25 border border-green-500/30 text-green-400 rounded-xl text-xs font-semibold">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-accent-900/25 border border-accent-500/30 text-accent-400 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="e.g. manufacturer_node"
                className="w-full pl-10 pr-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Registered Email</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500"><Mail size={16} /></span>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. mfg@pharma-corp.com"
                className="w-full pl-10 pr-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">New Password</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500"><Lock size={16} /></span>
              <input
                type="password"
                name="new_password"
                required
                value={formData.new_password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 text-sm bg-[#151c2c] border border-[#222f47] rounded-xl text-white focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-xl transition-all"
          >
            {loading ? 'Processing Reset...' : 'Update Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs text-primary-400 hover:underline">Return to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
