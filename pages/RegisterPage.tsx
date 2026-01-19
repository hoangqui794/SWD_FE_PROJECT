
import React from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative bg-black items-center justify-center overflow-hidden border-r border-zinc-800">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "32px 32px"}}></div>
        <div className="relative z-10 px-12 max-w-xl text-white">
          <div className="mb-8 w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
            <span className="material-symbols-outlined text-4xl">eco</span>
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
            <div className="space-y-2">
              <label className="block text-sm font-medium">Full Name</label>
              <input 
                className="w-full p-3 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-white" 
                placeholder="Enter full name" 
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Email</label>
              <input 
                type="email"
                className="w-full p-3 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-white" 
                placeholder="name@company.com" 
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Password</label>
                <input 
                  className="w-full p-3 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-white" 
                  type="password" 
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Confirm</label>
                <input 
                  className="w-full p-3 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-white" 
                  type="password" 
                  required
                />
              </div>
            </div>
            <div className="pt-4 flex flex-col gap-4">
              <button 
                type="submit"
                className="w-full h-12 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest rounded-lg transition-transform active:scale-95"
              >
                Create Account
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
