import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { authService } from '../services/authService';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    roleId: 2, // Default to Manager (2) or similar
    orgId: 1, // Default OrgId
    siteId: 1, // Default SiteId (1 = WinMart Store 01)
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Construct the payload as requested
      const payload = {
        orgId: Number(formData.orgId),
        siteId: Number(formData.siteId),
        fullName: formData.fullName,
        email: formData.email,
        roleId: Number(formData.roleId)
      };

      await authService.register(payload);

      // Success
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative bg-black items-center justify-center overflow-hidden border-r border-zinc-800">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>
        <div className="relative z-10 px-12 max-w-xl text-white">
          <div className="mb-8 w-16 h-16">
            <img src="/favicon.svg" alt="Project Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight tracking-tight">
            Smart Environmental <span className="text-zinc-400">Monitoring Solution</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            Centralized management for Chain Stores. Monitor sensors, track compliance, and manage staff access securely across all your locations.
          </p>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center bg-white dark:bg-zinc-950 overflow-y-auto">
        <div className="w-full max-w-lg mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Create Account</h2>
          <p className="text-slate-500 dark:text-zinc-400 mb-8">Register new personnel for organizational access.</p>

          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium">Full Name</label>
              <input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-white"
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-white"
                placeholder="name@company.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Organization</label>
                <select
                  name="orgId"
                  value={formData.orgId}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-white"
                >
                  <option value={1}>WinMart System</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Site</label>
                <select
                  name="siteId"
                  value={formData.siteId}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-white"
                >
                  <option value={1}>WinMart Store 01</option>
                  <option value={0}>Head Office (No Site)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Role</label>
              <select
                name="roleId"
                value={formData.roleId}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-white"
              >
                <option value={1}>Admin</option>
                <option value={2}>Manager</option>
                <option value={3}>Staff</option>
              </select>
            </div>


            <div className="pt-4 flex flex-col gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest rounded-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-sm font-semibold text-slate-500 hover:text-black dark:hover:text-white"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
