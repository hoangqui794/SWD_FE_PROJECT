import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/auth';

import { authService } from '../services/authService';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('111');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // The authService.login call now sends both email and password
      const data = await authService.login({ email, password });

      // Ensure the role matches our Role type
      // If the API returns a string that might not match exact formatting, normalize it
      const normalizedUser = {
        ...data.user,
        role: data.user.role.toUpperCase() as Role
      };

      login(normalizedUser, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex w-full flex-col items-center justify-center p-4 sm:p-6 lg:p-8 min-h-screen bg-background-light dark:bg-background-dark">
      <div className="flex flex-col w-full max-w-[520px] bg-white dark:bg-black border border-black dark:border-white shadow-none overflow-hidden my-auto">
        <div className="flex flex-col items-center pt-12 pb-2 px-8">
          <div className="h-16 w-16 mb-6">
            <img src="/favicon.svg" alt="Project Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-slate-900 dark:text-white tracking-tight text-2xl font-bold leading-tight text-center uppercase">IoT Smart Environmental Monitor</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-normal text-center mt-3">Welcome back, please login to your account.</p>
        </div>
        <form onSubmit={handleLogin} className="flex flex-col gap-6 p-8 pt-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded text-sm text-center">
              {error}
            </div>
          )}
          <label className="flex flex-col w-full">
            <p className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wider pb-2">Email</p>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-slate-400">mail</span>
              <input
                className="form-input flex w-full border-2 border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:outline-0 focus:ring-0 focus:border-primary h-12 pl-12 pr-4 placeholder:text-slate-400 text-base"
                placeholder="user@iot-admin.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </label>
          <label className="flex flex-col w-full">
            <p className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wider pb-2">Password</p>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-slate-400">lock</span>
              <input
                className="form-input flex w-full border-2 border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:outline-0 focus:ring-0 focus:border-primary h-12 pl-12 pr-12 placeholder:text-slate-400 text-base"
                placeholder="••••••••"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </label>

          <div className="pt-4 flex flex-col gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center h-12 px-5 bg-black dark:bg-white text-white dark:text-black text-sm font-bold uppercase tracking-widest transition-colors hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            <div className="flex items-center justify-center gap-2">
              <p className="text-slate-500 dark:text-slate-400 text-sm">Don't have an account?</p>
              <Link to="/register" className="text-black dark:text-white hover:underline text-sm font-bold uppercase tracking-wide">Register</Link>
            </div>
          </div>
        </form>
        <div className="h-1 w-full bg-primary"></div>
      </div>
    </div>
  );
};

export default LoginPage;
